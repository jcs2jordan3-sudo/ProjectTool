"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronRight, Play, CheckSquare, MoreHorizontal, Pencil, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { cn } from "@/lib/utils";
import { SprintFormDialog } from "./SprintFormDialog";

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-400",
  MEDIUM: "bg-yellow-400",
  LOW: "bg-slate-300",
};
const TYPE_LABEL: Record<string, string> = { EPIC: "E", STORY: "S", TASK: "T" };
const TYPE_COLOR: Record<string, string> = {
  EPIC: "bg-purple-100 text-purple-700",
  STORY: "bg-blue-100 text-blue-700",
  TASK: "bg-green-100 text-green-700",
};
const STATUS_COLOR: Record<string, string> = {
  PLANNED: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
};
const STATUS_LABEL: Record<string, string> = {
  PLANNED: "계획됨",
  ACTIVE: "진행 중",
  COMPLETED: "완료됨",
};

type Issue = {
  id: string;
  type: "EPIC" | "STORY" | "TASK";
  title: string;
  priority: string;
  assignee?: { id: string; name: string; color: string } | null;
  boardStatus?: { isFinal: boolean } | null;
  sprintId?: string | null;
};

type Sprint = {
  id: string;
  name: string;
  goal?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
  issues: Issue[];
};

type Props = {
  projectId: string;
  sprints: Sprint[];
  backlogIssues: Issue[];
};

function IssueRow({
  issue,
  projectId,
  sprints,
  onMove,
  onRemoveFromSprint,
}: {
  issue: Issue;
  projectId: string;
  sprints: Sprint[];
  onMove?: (issueId: string, sprintId: string) => void;
  onRemoveFromSprint?: (issueId: string) => void;
}) {
  const router = useRouter();
  const availableSprints = sprints.filter(
    (s) => s.status !== "COMPLETED" && s.id !== issue.sprintId
  );

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 hover:bg-accent/40 rounded-md cursor-pointer group"
      onClick={() => router.push(`/projects/${projectId}/issues/${issue.id}`)}
    >
      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", TYPE_COLOR[issue.type])}>
        {TYPE_LABEL[issue.type]}
      </span>
      <span className="flex-1 text-sm truncate">{issue.title}</span>
      <span className={cn("w-2 h-2 rounded-full shrink-0", PRIORITY_DOT[issue.priority] ?? "bg-slate-300")} />
      {issue.assignee && (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
          style={{ backgroundColor: issue.assignee.color }}
          title={issue.assignee.name}
        >
          {issue.assignee.name[0]}
        </div>
      )}
      {issue.boardStatus?.isFinal && (
        <Badge variant="outline" className="text-[10px] text-green-600 border-green-300 py-0 px-1.5">완료</Badge>
      )}
      <div
        className="opacity-0 group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onRemoveFromSprint && (
              <DropdownMenuItem onClick={() => onRemoveFromSprint(issue.id)}>
                <ArrowLeft size={12} className="mr-1.5" />
                백로그로 이동
              </DropdownMenuItem>
            )}
            {availableSprints.length > 0 && (
              <>
                {onRemoveFromSprint && <DropdownMenuSeparator />}
                {availableSprints.map((s) => (
                  <DropdownMenuItem key={s.id} onClick={() => onMove?.(issue.id, s.id)}>
                    <ArrowRight size={12} className="mr-1.5" />
                    {s.name}으로 이동
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function SprintSection({
  sprint,
  projectId,
  allSprints,
  onRefresh,
}: {
  sprint: Sprint;
  projectId: string;
  allSprints: Sprint[];
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(sprint.status === "ACTIVE");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const total = sprint.issues.length;
  const done = sprint.issues.filter((i) => i.boardStatus?.isFinal).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  function formatDate(d: Date | string | null | undefined) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  }

  async function handleStart() {
    const res = await fetch(`/api/projects/${projectId}/sprints/${sprint.id}/start`, {
      method: "POST",
    });
    if (res.ok) onRefresh();
    else {
      const data = await res.json();
      alert(data.error ?? "시작 실패");
    }
  }

  async function handleComplete() {
    const res = await fetch(`/api/projects/${projectId}/sprints/${sprint.id}/complete`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.movedToBacklog > 0) {
        alert(`완료 처리됨. ${data.movedToBacklog}개 미완료 이슈가 백로그로 이동됐습니다.`);
      }
      onRefresh();
    }
    setCompleteOpen(false);
  }

  async function handleDelete() {
    const res = await fetch(`/api/projects/${projectId}/sprints/${sprint.id}`, {
      method: "DELETE",
    });
    if (res.ok) onRefresh();
    setDeleteOpen(false);
  }

  async function handleMoveIssue(issueId: string, targetSprintId: string) {
    const res = await fetch(`/api/projects/${projectId}/sprints/${targetSprintId}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueIds: [issueId] }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "이슈 이동에 실패했습니다.");
      return;
    }
    onRefresh();
  }

  async function handleRemoveIssue(issueId: string) {
    const res = await fetch(`/api/projects/${projectId}/sprints/${sprint.id}/issues`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueIds: [issueId] }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "이슈 제거에 실패했습니다.");
      return;
    }
    onRefresh();
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 hover:text-foreground text-muted-foreground"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <span className="font-medium text-sm">{sprint.name}</span>
        <Badge className={cn("text-[10px] py-0 px-1.5", STATUS_COLOR[sprint.status])}>
          {STATUS_LABEL[sprint.status]}
        </Badge>
        {(sprint.startDate || sprint.endDate) && (
          <span className="text-xs text-muted-foreground">
            {formatDate(sprint.startDate)} ~ {formatDate(sprint.endDate)}
          </span>
        )}
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {total}개
        </span>
        {total > 0 && (
          <div className="flex items-center gap-1.5 ml-2">
            <Progress value={progress} className="w-20 h-1.5" />
            <span className="text-xs text-muted-foreground">{done}/{total}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1">
          {sprint.status === "PLANNED" && (
            <Button size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={handleStart}>
              <Play size={10} />
              시작
            </Button>
          )}
          {sprint.status === "ACTIVE" && (
            <Button size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={() => setCompleteOpen(true)}>
              <CheckSquare size={10} />
              완료
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil size={12} className="mr-1.5" />
                수정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={12} className="mr-1.5" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 목표 */}
      {sprint.goal && expanded && (
        <div className="px-4 py-2 text-xs text-muted-foreground border-b bg-muted/10">
          🎯 {sprint.goal}
        </div>
      )}

      {/* 이슈 목록 */}
      {expanded && (
        <div className="p-2">
          {sprint.issues.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              이슈 없음 — 백로그에서 이슈를 이동하세요
            </p>
          ) : (
            sprint.issues.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                projectId={projectId}
                sprints={allSprints}
                onMove={handleMoveIssue}
                onRemoveFromSprint={handleRemoveIssue}
              />
            ))
          )}
        </div>
      )}

      {/* 다이얼로그들 */}
      {editOpen && (
        <SprintFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          projectId={projectId}
          sprint={sprint}
          onSuccess={onRefresh}
        />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>스프린트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{sprint.name}"을 삭제합니다. 포함된 이슈는 백로그로 이동됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>스프린트 완료</AlertDialogTitle>
            <AlertDialogDescription>
              미완료 이슈 {sprint.issues.filter((i) => !i.boardStatus?.isFinal).length}개가 백로그로 이동됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>완료 처리</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function BacklogClient({ projectId, sprints: initialSprints, backlogIssues: initialBacklog }: Props) {
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [backlogIssues, setBacklogIssues] = useState<Issue[]>(initialBacklog);
  const [createOpen, setCreateOpen] = useState(false);
  const [backlogExpanded, setBacklogExpanded] = useState(true);

  const refresh = useCallback(async () => {
    const [sprintsRes, backlogRes] = await Promise.all([
      fetch(`/api/projects/${projectId}/sprints`),
      fetch(`/api/projects/${projectId}/issues?sprintId=none&type=notEpic`),
    ]);
    if (sprintsRes.ok) setSprints(await sprintsRes.json());
    if (backlogRes.ok) setBacklogIssues(await backlogRes.json());
  }, [projectId]);

  async function handleMoveToSprint(issueId: string, sprintId: string) {
    await fetch(`/api/projects/${projectId}/sprints/${sprintId}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueIds: [issueId] }),
    });
    await refresh();
  }

  // 활성/계획됨/완료 순서로 정렬
  const orderedSprints = [
    ...sprints.filter((s) => s.status === "ACTIVE"),
    ...sprints.filter((s) => s.status === "PLANNED"),
    ...sprints.filter((s) => s.status === "COMPLETED"),
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">백로그</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} className="mr-1" />
          스프린트 생성
        </Button>
      </div>

      {/* 스프린트 섹션들 */}
      {orderedSprints.map((sprint) => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          projectId={projectId}
          allSprints={sprints}
          onRefresh={refresh}
        />
      ))}

      {/* 백로그 섹션 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
          <button
            onClick={() => setBacklogExpanded(!backlogExpanded)}
            className="flex items-center gap-1 hover:text-foreground text-muted-foreground"
          >
            {backlogExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <span className="font-medium text-sm">백로그</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {backlogIssues.length}개
          </span>
        </div>

        {backlogExpanded && (
          <div className="p-2">
            {backlogIssues.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                백로그가 비어 있습니다
              </p>
            ) : (
              backlogIssues.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  projectId={projectId}
                  sprints={sprints}
                  onMove={handleMoveToSprint}
                />
              ))
            )}
          </div>
        )}
      </div>

      {createOpen && (
        <SprintFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          projectId={projectId}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
