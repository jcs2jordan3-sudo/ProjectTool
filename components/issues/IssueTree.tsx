"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PriorityIcon } from "@/components/shared/PriorityIcon";
import { Button } from "@/components/ui/button";
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
import { apiFetch } from "@/lib/api";

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
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(false);

  const hasChildren = issue.children.length > 0;

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiFetch<void>(`/api/projects/${projectId}/issues/${issue.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "issues"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "kanbanIssues"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "sprints"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "backlogIssues"] });
      router.refresh();
      setDeleteTarget(false);
      onRefresh();
    },
  });

  const parentOptions = allIssues.map((i) => ({ id: i.id, title: i.title, type: i.type }));

  return (
    <>
      <div
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-accent/30 rounded group cursor-pointer"
        style={{ paddingLeft: `${8 + depth * 20}px` }}
        onClick={() => router.push(`/projects/${projectId}/issues/${issue.id}`)}
      >
        {/* 펼치기/접기 + 타입 배지 + 제목 */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
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

          <span className="text-sm truncate">{issue.title}</span>
        </div>

        {/* 직군 배지 */}
        <div className="w-24 shrink-0 flex justify-center gap-0.5">
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

        {/* 상태 */}
        <div className="w-20 shrink-0 flex justify-center">
          {issue.boardStatus && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: issue.boardStatus.color + "20", color: issue.boardStatus.color }}
            >
              {issue.boardStatus.name}
            </span>
          )}
        </div>

        {/* 우선순위 */}
        <span className="w-14 shrink-0 flex justify-center">
          <PriorityIcon priority={issue.priority} size={14} showLabel />
        </span>

        {/* 담당자 아바타 */}
        <div className="w-6 shrink-0 flex justify-center">
          {issue.assignee && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
              style={{ backgroundColor: issue.assignee.color }}
              title={issue.assignee.name}
            >
              {issue.assignee.name[0]}
            </div>
          )}
        </div>

        {/* 액션 */}
        <div className="w-6 shrink-0 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
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
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "삭제 중..." : "삭제"}
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
        <div className="flex items-center gap-2 px-2 py-2 border-b bg-muted/30 text-xs text-muted-foreground font-medium">
          <span className="flex-1 pl-6">제목</span>
          <span className="w-24 text-center shrink-0">직군</span>
          <span className="w-20 text-center shrink-0">상태</span>
          <span className="w-14 text-center shrink-0">우선순위</span>
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
