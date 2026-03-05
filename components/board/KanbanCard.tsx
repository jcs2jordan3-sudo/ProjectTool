"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { CalendarDays, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriorityIcon } from "@/components/shared/PriorityIcon";
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
import { useDeleteIssue } from "@/lib/hooks/use-issue-detail";

const DW_ICON: Record<string, string> = { DONE: "✅", IN_PROGRESS: "🔄", TODO: "⏳" };

type DisciplineWork = {
  id: string;
  status: string;
  discipline: { id: string; name: string; color: string };
};

export type KanbanIssue = {
  id: string;
  type: "EPIC" | "STORY" | "TASK";
  title: string;
  priority: string;
  order: number;
  boardStatusId?: string | null;
  epicColor?: string | null;
  dueDate?: Date | string | null;
  assignee?: { id: string; name: string; color: string } | null;
  parent?: { id: string; title: string; epicColor?: string | null } | null;
  disciplineWorks: DisciplineWork[];
  _count?: { comments: number };
};

type Props = {
  issue: KanbanIssue;
  projectId: string;
  isDragOverlay?: boolean;
  onIssueClick?: (issueId: string) => void;
};

export function KanbanCard({ issue, projectId, isDragOverlay, onIssueClick }: Props) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteIssue = useDeleteIssue(projectId, issue.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: issue.id, data: { issue } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const now = new Date();
  const dueDateObj = issue.dueDate ? new Date(issue.dueDate) : null;
  const diffDays = dueDateObj
    ? Math.ceil((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isOverdue = diffDays !== null && diffDays < 0;
  const isToday = diffDays !== null && diffDays === 0;
  const isSoon = diffDays !== null && diffDays > 0 && diffDays <= 3;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-background border rounded-lg p-3 cursor-grab active:cursor-grabbing select-none",
        "hover:border-primary/40 hover:shadow-sm transition-all",
        isDragging && "opacity-40",
        isDragOverlay && "shadow-lg rotate-1 opacity-95"
      )}
      onClick={(e) => {
        // 드래그 중이 아닐 때만 이동
        if (!isDragging) {
          e.stopPropagation();
          if (onIssueClick) {
            onIssueClick(issue.id);
          } else {
            router.push(`/projects/${projectId}/issues/${issue.id}`);
          }
        }
      }}
    >
      {/* 상위 Epic 표시 */}
      {issue.parent && (
        <div className="flex items-center gap-1 mb-1.5">
          <span
            className="text-[9px] font-bold px-1 py-0.5 rounded text-white"
            style={{ backgroundColor: issue.parent.epicColor ?? "#6366f1" }}
          >
            {issue.parent.title.slice(0, 20)}
          </span>
        </div>
      )}

      {/* 제목 */}
      <p className="text-sm leading-snug mb-2 line-clamp-2">{issue.title}</p>

      {/* 직군 배지 + 진행도 바 (TASK) */}
      {issue.disciplineWorks.length > 0 && (
        <div className="mb-2 space-y-1.5">
          <div className="flex flex-wrap gap-1">
            {issue.disciplineWorks.map((dw) => (
              <span
                key={dw.id}
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ backgroundColor: dw.discipline.color + "20", color: dw.discipline.color }}
                title={`${dw.discipline.name}: ${dw.status}`}
              >
                {dw.discipline.name[0]}{DW_ICON[dw.status]}
              </span>
            ))}
          </div>
          <ProgressBar disciplineWorks={issue.disciplineWorks} />
        </div>
      )}

      {/* 하단: 우선순위 + 마감일 + 담당자 + 메뉴 */}
      <div className="flex items-center gap-2 mt-1">
        <PriorityIcon priority={issue.priority} size={12} />

        {issue.dueDate && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full",
              isOverdue || isToday
                ? "bg-red-100 text-red-600 font-medium"
                : isSoon
                ? "bg-orange-100 text-orange-600"
                : "text-muted-foreground"
            )}
          >
            <CalendarDays size={10} />
            {new Date(issue.dueDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          {issue._count && issue._count.comments > 0 && (
            <span className="text-[10px] text-muted-foreground">💬{issue._count.comments}</span>
          )}
          {issue.assignee && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
              style={{ backgroundColor: issue.assignee.color }}
              title={issue.assignee.name}
            >
              {issue.assignee.name[0]}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={14} className="mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 삭제 확인 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>이슈를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{issue.title}&quot; 이슈가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteIssue.mutate()}
              disabled={deleteIssue.isPending}
            >
              {deleteIssue.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 담당자가 지정된 직군만 카운트하여 진행도 바 표시
function ProgressBar({ disciplineWorks }: { disciplineWorks: DisciplineWork[] }) {
  // For progress, we count all discipline works (assigned or not)
  const total = disciplineWorks.length;
  const done = disciplineWorks.filter((dw) => dw.status === "DONE").length;

  if (total === 0) return null;

  const percent = Math.round((done / total) * 100);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            percent === 100 ? "bg-green-500" : percent > 0 ? "bg-primary" : "bg-muted"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[9px] text-muted-foreground shrink-0">
        {done}/{total}
      </span>
    </div>
  );
}
