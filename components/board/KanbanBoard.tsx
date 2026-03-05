"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { KanbanCard, KanbanIssue } from "./KanbanCard";
import { IssueFormDialog } from "@/components/issues/IssueFormDialog";
import { IssueDetailSheet } from "@/components/issues/IssueDetailSheet";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReorderIssues, issueKeys } from "@/lib/hooks/use-issues";

type BoardStatus = { id: string; name: string; color: string; isFinal: boolean; order: number };
type Member = { id: string; name: string; color: string };
type ParentOption = { id: string; title: string; type: "EPIC" | "STORY" | "TASK" };

type Props = {
  projectId: string;
  statuses: BoardStatus[];
  initialIssues: KanbanIssue[];
  members: Member[];
  allStatuses: BoardStatus[];
  parentOptions: ParentOption[];
};

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------

function Column({
  status,
  issues,
  projectId,
  members,
  allStatuses,
  parentOptions,
  onIssueAdded,
  onIssueClick,
}: {
  status: BoardStatus;
  issues: KanbanIssue[];
  projectId: string;
  members: Member[];
  allStatuses: BoardStatus[];
  parentOptions: ParentOption[];
  onIssueAdded: () => void;
  onIssueClick: (issueId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });
  const [addOpen, setAddOpen] = useState(false);

  function handleSuccess() {
    setAddOpen(false);
    onIssueAdded();
  }

  return (
    <div
      className="flex flex-col w-72 shrink-0 rounded-lg border bg-background overflow-hidden"
      style={{ borderTop: `3px solid ${status.color}` }}
    >
      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{status.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {issues.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => setAddOpen(true)}
        >
          <Plus size={14} />
        </Button>
      </div>

      {/* 카드 목록 */}
      <div
        ref={setNodeRef}
        className="flex-1 min-h-24 space-y-2 p-2 transition-colors"
        style={{
          backgroundColor: isOver ? status.color + "18" : status.color + "08",
        }}
      >
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <KanbanCard key={issue.id} issue={issue} projectId={projectId} onIssueClick={onIssueClick} />
          ))}
        </SortableContext>
        {issues.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
            이슈 없음
          </div>
        )}
      </div>

      {/* 이슈 추가 다이얼로그 */}
      {addOpen && (
        <IssueFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          projectId={projectId}
          defaultType="TASK"
          members={members}
          boardStatuses={allStatuses}
          parentOptions={parentOptions}
          initial={{ boardStatusId: status.id }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KanbanBoard
// ---------------------------------------------------------------------------

export function KanbanBoard({ projectId, statuses, initialIssues, members, allStatuses, parentOptions }: Props) {
  const queryClient = useQueryClient();
  const reorderMutation = useReorderIssues(projectId);

  // 컬럼별 이슈 맵: statusId → issues[]
  const [columns, setColumns] = useState<Record<string, KanbanIssue[]>>(() =>
    buildInitialColumns(statuses, initialIssues)
  );

  const [activeIssue, setActiveIssue] = useState<KanbanIssue | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // 필터
  const [filterType, setFilterType] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const hasActiveFilter = filterType || filterAssignee;

  function filterIssues(issues: KanbanIssue[]): KanbanIssue[] {
    return issues.filter((issue) => {
      if (filterType && issue.type !== filterType) return false;
      if (filterAssignee === "none" && issue.assignee) return false;
      if (filterAssignee && filterAssignee !== "none" && issue.assignee?.id !== filterAssignee) return false;
      return true;
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function findColumn(issueId: string): string | undefined {
    for (const [colId, issues] of Object.entries(columns)) {
      if (issues.find((i) => i.id === issueId)) return colId;
    }
    return undefined;
  }

  function handleDragStart(event: DragStartEvent) {
    const issue = event.active.data.current?.issue as KanbanIssue;
    setActiveIssue(issue ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeColId = findColumn(active.id as string);
    const overColId =
      columns[over.id as string] !== undefined
        ? (over.id as string)
        : findColumn(over.id as string);

    if (!activeColId || !overColId || activeColId === overColId) return;

    setColumns((prev) => {
      const activeItems = [...prev[activeColId]];
      const overItems = [...prev[overColId]];
      const activeIdx = activeItems.findIndex((i) => i.id === active.id);
      const overIdx = overItems.findIndex((i) => i.id === over.id);

      const [moved] = activeItems.splice(activeIdx, 1);
      overItems.splice(overIdx >= 0 ? overIdx : overItems.length, 0, moved);

      return { ...prev, [activeColId]: activeItems, [overColId]: overItems };
    });
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveIssue(null);
      if (!over) return;

      const activeColId = findColumn(active.id as string);
      const overColId =
        columns[over.id as string] !== undefined
          ? (over.id as string)
          : findColumn(over.id as string);

      if (!activeColId || !overColId) return;

      if (activeColId === overColId) {
        // 같은 컬럼 내 순서 변경
        const items = columns[activeColId];
        const oldIdx = items.findIndex((i) => i.id === active.id);
        const newIdx = items.findIndex((i) => i.id === over.id);
        if (oldIdx === newIdx) return;

        const newOrder = arrayMove(items, oldIdx, newIdx);
        // 낙관적 업데이트: 즉시 UI 반영
        setColumns((prev) => ({ ...prev, [activeColId]: newOrder }));

        reorderMutation.mutate({
          issueId: active.id as string,
          boardStatusId: activeColId,
          orderedIds: newOrder.map((i) => i.id),
        });
      } else {
        // 다른 컬럼으로 이동 (handleDragOver에서 이미 UI 업데이트됨)
        const newColItems = columns[overColId];
        reorderMutation.mutate({
          issueId: active.id as string,
          boardStatusId: overColId,
          orderedIds: newColItems.map((i) => i.id),
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, projectId, reorderMutation]
  );

  // 이슈 추가 성공 시 서버 데이터를 다시 가져온다.
  function handleIssueAdded() {
    queryClient.invalidateQueries({ queryKey: issueKeys.kanban(projectId) });
    queryClient.invalidateQueries({ queryKey: issueKeys.all(projectId) });
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 필터 바 */}
      <div className="flex items-center gap-2 shrink-0">
        <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="분류" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 분류</SelectItem>
            <SelectItem value="STORY">STORY</SelectItem>
            <SelectItem value="TASK">TASK</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAssignee || "all"} onValueChange={(v) => setFilterAssignee(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="담당자" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 담당자</SelectItem>
            <SelectItem value="none">미배정</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => { setFilterType(""); setFilterAssignee(""); }}
          >
            <X size={12} className="mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* 칸반 보드 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
          {statuses.map((status) => {
            const filtered = filterIssues(columns[status.id] ?? []);
            return (
              <Column
                key={status.id}
                status={status}
                issues={filtered}
                projectId={projectId}
                members={members}
                allStatuses={allStatuses}
                parentOptions={parentOptions}
                onIssueAdded={handleIssueAdded}
                onIssueClick={setSelectedIssueId}
              />
            );
          })}
        </div>

        {typeof document !== "undefined" &&
          createPortal(
            <DragOverlay>
              {activeIssue ? (
                <KanbanCard issue={activeIssue} projectId={projectId} isDragOverlay />
              ) : null}
            </DragOverlay>,
            document.body
          )}

        <IssueDetailSheet
          projectId={projectId}
          issueId={selectedIssueId}
          onClose={() => setSelectedIssueId(null)}
        />
      </DndContext>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialColumns(
  statuses: { id: string }[],
  issues: KanbanIssue[]
): Record<string, KanbanIssue[]> {
  const map: Record<string, KanbanIssue[]> = {};
  for (const s of statuses) map[s.id] = [];

  const first = statuses[0]?.id;
  for (const issue of issues) {
    const key = issue.boardStatusId ?? first;
    if (key && map[key]) {
      map[key].push(issue);
    } else if (first) {
      map[first].push(issue);
    }
  }

  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  return map;
}
