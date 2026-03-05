"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const DW_ICON: Record<string, string> = { DONE: "✅", IN_PROGRESS: "🔄", TODO: "⏳" };
const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-red-500", HIGH: "bg-orange-400", MEDIUM: "bg-yellow-400", LOW: "bg-slate-300",
};

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: issue.id, data: { issue } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    issue.dueDate && new Date(issue.dueDate) < new Date() ? true : false;

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

      {/* 하단: 우선순위 + 마감일 + 담당자 */}
      <div className="flex items-center gap-2 mt-1">
        <span className={cn("w-2 h-2 rounded-full shrink-0", PRIORITY_DOT[issue.priority] ?? "bg-slate-300")} />

        {issue.dueDate && (
          <span className={cn("text-[10px]", isOverdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
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
        </div>
      </div>
    </div>
  );
}

// 담당자가 지정된 직군만 카운트하여 진행도 바 표시
function ProgressBar({ disciplineWorks }: { disciplineWorks: DisciplineWork[] }) {
  const assigned = disciplineWorks.filter((dw) => dw.discipline); // all have discipline
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
