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
import { KanbanCard, KanbanIssue } from "./KanbanCard";
import { IssueFormDialog } from "@/components/issues/IssueFormDialog";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type BoardStatus = { id: string; name: string; color: string; isFinal: boolean; order: number };
type Member = { id: string; name: string; color: string };

type Props = {
  projectId: string;
  statuses: BoardStatus[];
  initialIssues: KanbanIssue[];
  members: Member[];
  allStatuses: BoardStatus[];
};

// 컬럼 드롭 영역
function Column({
  status,
  issues,
  projectId,
  members,
  allStatuses,
  onIssueAdded,
}: {
  status: BoardStatus;
  issues: KanbanIssue[];
  projectId: string;
  members: Member[];
  allStatuses: BoardStatus[];
  onIssueAdded: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
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
        className={`flex-1 min-h-24 space-y-2 rounded-lg p-1 transition-colors ${
          isOver ? "bg-accent/40" : ""
        }`}
      >
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <KanbanCard key={issue.id} issue={issue} projectId={projectId} />
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
          parentOptions={[]}
          initial={{ boardStatusId: status.id }}
          onSuccess={onIssueAdded}
        />
      )}
    </div>
  );
}

export function KanbanBoard({ projectId, statuses, initialIssues, members, allStatuses }: Props) {
  // 컬럼별 이슈 맵: statusId → issues[]
  const [columns, setColumns] = useState<Record<string, KanbanIssue[]>>(() => {
    const map: Record<string, KanbanIssue[]> = {};
    for (const s of statuses) map[s.id] = [];
    // null boardStatusId는 첫 컬럼에
    const first = statuses[0]?.id;
    for (const issue of initialIssues) {
      const key = issue.boardStatusId ?? first;
      if (key && map[key]) map[key].push(issue);
      else if (first) map[first].push(issue);
    }
    // 각 컬럼 order 정렬
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return map;
  });

  const [activeIssue, setActiveIssue] = useState<KanbanIssue | null>(null);

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
    // over가 컬럼 id인지 카드 id인지 확인
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
    async (event: DragEndEvent) => {
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
        setColumns((prev) => ({ ...prev, [activeColId]: newOrder }));

        await fetch(`/api/projects/${projectId}/issues/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issueId: active.id,
            boardStatusId: activeColId,
            orderedIds: newOrder.map((i) => i.id),
          }),
        });
      } else {
        // 다른 컬럼으로 이동 (handleDragOver에서 이미 UI 업데이트됨)
        const newColItems = columns[overColId];
        await fetch(`/api/projects/${projectId}/issues/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issueId: active.id,
            boardStatusId: overColId,
            orderedIds: newColItems.map((i) => i.id),
          }),
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, projectId]
  );

  function handleIssueAdded() {
    // 서버에서 최신 데이터 다시 로드 (간단하게 새로고침)
    window.location.reload();
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {statuses.map((status) => (
          <Column
            key={status.id}
            status={status}
            issues={columns[status.id] ?? []}
            projectId={projectId}
            members={members}
            allStatuses={allStatuses}
            onIssueAdded={handleIssueAdded}
          />
        ))}
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
    </DndContext>
  );
}
