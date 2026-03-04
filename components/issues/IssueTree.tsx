"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IssueFormDialog } from "./IssueFormDialog";
import { cn } from "@/lib/utils";

type IssueType = "EPIC" | "STORY" | "TASK";
type Priority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

type DisciplineWork = {
  id: string;
  status: string;
  discipline: { id: string; name: string; color: string };
};

type Issue = {
  id: string;
  type: IssueType;
  title: string;
  priority: Priority;
  epicColor?: string | null;
  boardStatus?: { id: string; name: string; color: string } | null;
  assignee?: { id: string; name: string; color: string } | null;
  dueDate?: Date | string | null;
  disciplineWorks: DisciplineWork[];
  children: Issue[];
  parentId?: string | null;
};

type Member = { id: string; name: string; color: string };
type BoardStatus = { id: string; name: string; color: string };

type Props = {
  projectId: string;
  issues: Issue[];
  members: Member[];
  boardStatuses: BoardStatus[];
  onRefresh: () => void;
  hideAddButton?: boolean;
};

const PRIORITY_COLORS: Record<Priority, string> = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-yellow-500",
  LOW: "text-slate-400",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  URGENT: "긴급", HIGH: "높음", MEDIUM: "보통", LOW: "낮음",
};

const DW_ICON: Record<string, string> = {
  DONE: "✅", IN_PROGRESS: "🔄", TODO: "⏳",
};

function IssueRow({
  issue, depth, projectId, members, boardStatuses, allIssues, onRefresh,
}: {
  issue: Issue;
  depth: number;
  projectId: string;
  members: Member[];
  boardStatuses: BoardStatus[];
  allIssues: Issue[];
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const hasChildren = issue.children.length > 0;

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/issues/${issue.id}`, { method: "DELETE" });
      setDeleteTarget(false);
      onRefresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  const parentOptions = allIssues.map((i) => ({ id: i.id, title: i.title, type: i.type }));

  return (
    <>
      <div
        className="flex items-center gap-1 py-1.5 px-2 hover:bg-accent/30 rounded group cursor-pointer"
        style={{ paddingLeft: `${8 + depth * 20}px` }}
        onClick={() => router.push(`/projects/${projectId}/issues/${issue.id}`)}
      >
        {/* 펼치기/접기 */}
        <button
          className="w-4 h-4 flex items-center justify-center text-muted-foreground shrink-0"
          onClick={(e) => { e.stopPropagation(); if (hasChildren) setExpanded(!expanded); }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : (
            <span className="w-3 h-3 rounded-sm border border-muted inline-block" />
          )}
        </button>

        {/* 타입 배지 */}
        {issue.type === "EPIC" && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
            style={{ backgroundColor: issue.epicColor ?? "#6366f1" }}
          >
            EPIC
          </span>
        )}
        {issue.type === "STORY" && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">
            STORY
          </span>
        )}
        {issue.type === "TASK" && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
            TASK
          </span>
        )}

        {/* 제목 */}
        <span className="flex-1 text-sm truncate">{issue.title}</span>

        {/* 직군 배지 */}
        {issue.disciplineWorks.length > 0 && (
          <div className="flex gap-1 shrink-0">
            {issue.disciplineWorks.slice(0, 4).map((dw) => (
              <span
                key={dw.id}
                className="text-[10px] px-1 py-0.5 rounded"
                style={{ backgroundColor: dw.discipline.color + "20", color: dw.discipline.color }}
                title={`${dw.discipline.name}: ${dw.status}`}
              >
                {dw.discipline.name[0]}{DW_ICON[dw.status]}
              </span>
            ))}
          </div>
        )}

        {/* 상태 */}
        {issue.boardStatus && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
            style={{ backgroundColor: issue.boardStatus.color + "20", color: issue.boardStatus.color }}
          >
            {issue.boardStatus.name}
          </span>
        )}

        {/* 우선순위 */}
        <span className={cn("text-[10px] shrink-0 font-medium", PRIORITY_COLORS[issue.priority])}>
          {PRIORITY_LABELS[issue.priority]}
        </span>

        {/* 담당자 아바타 */}
        {issue.assignee && (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold shrink-0"
            style={{ backgroundColor: issue.assignee.color }}
            title={issue.assignee.name}
          >
            {issue.assignee.name[0]}
          </div>
        )}

        {/* 액션 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0">
              <MoreHorizontal size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}>
              <Pencil size={12} className="mr-2" />수정
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(true); }}
            >
              <Trash2 size={12} className="mr-2" />삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 하위 이슈 */}
      {expanded && issue.children.map((child) => (
        <IssueRow
          key={child.id}
          issue={child}
          depth={depth + 1}
          projectId={projectId}
          members={members}
          boardStatuses={boardStatuses}
          allIssues={allIssues}
          onRefresh={onRefresh}
        />
      ))}

      {editOpen && (
        <IssueFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          projectId={projectId}
          members={members}
          boardStatuses={boardStatuses}
          parentOptions={parentOptions}
          initial={{
            id: issue.id,
            type: issue.type,
            title: issue.title,
            priority: issue.priority,
            assigneeId: issue.assignee?.id ?? "",
            boardStatusId: issue.boardStatus?.id ?? "",
            parentId: issue.parentId ?? "",
            epicColor: issue.epicColor ?? "",
          }}
          onSuccess={onRefresh}
        />
      )}

      <AlertDialog open={deleteTarget} onOpenChange={setDeleteTarget}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이슈를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{issue.title}</strong>과 하위 이슈가 모두 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function IssueTree({ projectId, issues, members, boardStatuses, onRefresh, hideAddButton }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const parentOptions = issues.map((i) => ({ id: i.id, title: i.title, type: i.type }));

  // Epic만 루트에 표시 (나머지는 children으로)
  const roots = issues.filter((i) => !i.parentId || i.type === "EPIC");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">총 {issues.length}개 이슈</span>
        {!hideAddButton && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} />
            이슈 만들기
          </Button>
        )}
      </div>

      <div className="border rounded-lg">
        {/* 헤더 */}
        <div className="flex items-center gap-1 px-2 py-2 border-b bg-muted/30 text-xs text-muted-foreground font-medium">
          <span className="w-4 shrink-0" />
          <span className="flex-1 pl-1">제목</span>
          <span className="w-16 text-center shrink-0">상태</span>
          <span className="w-12 text-center shrink-0">우선순위</span>
          <span className="w-6 shrink-0" />
          <span className="w-6 shrink-0" />
        </div>

        {roots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            이슈가 없습니다. 첫 이슈를 만들어 보세요.
          </div>
        ) : (
          <div className="py-1">
            {roots.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                depth={0}
                projectId={projectId}
                members={members}
                boardStatuses={boardStatuses}
                allIssues={issues}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>

      <IssueFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={projectId}
        members={members}
        boardStatuses={boardStatuses}
        parentOptions={parentOptions}
        onSuccess={onRefresh}
      />
    </div>
  );
}
