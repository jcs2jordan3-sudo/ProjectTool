"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, X, LayoutList, ChevronRight, MoreHorizontal, Pencil, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { IssueTree } from "./IssueTree";
import { IssueFormDialog } from "./IssueFormDialog";

// ─── Types ──────────────────────────────────────────────────────

type DisciplineWork = {
  id: string;
  status: string;
  discipline: { id: string; name: string; color: string };
};

type Issue = {
  id: string;
  type: "EPIC" | "STORY" | "TASK";
  title: string;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  epicColor?: string | null;
  boardStatus?: { id: string; name: string; color: string } | null;
  assignee?: { id: string; name: string; color: string } | null;
  dueDate?: Date | string | null;
  createdAt?: Date | string;
  disciplineWorks: DisciplineWork[];
  children: Issue[];
  parentId?: string | null;
};

type Member = { id: string; name: string; color: string };
type BoardStatus = { id: string; name: string; color: string };

type Props = {
  projectId: string;
  initialIssues: Issue[];
  members: Member[];
  boardStatuses: BoardStatus[];
};

// ─── Helpers ────────────────────────────────────────────────────

function flattenIssues(issues: Issue[]): Issue[] {
  const result: Issue[] = [];
  function walk(issue: Issue) {
    result.push(issue);
    for (const child of issue.children ?? []) walk(child);
  }
  for (const issue of issues) walk(issue);
  return result;
}

function matchesSearch(issue: Issue, q: string): boolean {
  const lq = q.toLowerCase();
  return issue.title.toLowerCase().includes(lq);
}

function matchesFilters(
  issue: Issue,
  filters: { type: string; assigneeId: string; priority: string; statusId: string }
): boolean {
  if (filters.type && issue.type !== filters.type) return false;
  if (filters.assigneeId === "none" && issue.assignee) return false;
  if (filters.assigneeId && filters.assigneeId !== "none" && issue.assignee?.id !== filters.assigneeId) return false;
  if (filters.priority && issue.priority !== filters.priority) return false;
  if (filters.statusId && issue.boardStatus?.id !== filters.statusId) return false;
  return true;
}

function filterTree(
  issues: Issue[],
  predicate: (i: Issue) => boolean
): Issue[] {
  return issues.reduce<Issue[]>((acc, issue) => {
    const filteredChildren = filterTree(issue.children ?? [], predicate);
    if (predicate(issue) || filteredChildren.length > 0) {
      acc.push({ ...issue, children: filteredChildren });
    }
    return acc;
  }, []);
}

function sortFlat(issues: Issue[], sort: string): Issue[] {
  const sorted = [...issues];
  if (sort === "priority") {
    const order = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    sorted.sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2));
  } else if (sort === "dueDate") {
    sorted.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  } else if (sort === "createdAt") {
    sorted.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  return sorted;
}

// ─── Flat Row ────────────────────────────────────────────────────

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-red-500", HIGH: "bg-orange-400", MEDIUM: "bg-yellow-400", LOW: "bg-slate-300",
};
const PRIORITY_LABELS: Record<string, string> = {
  URGENT: "긴급", HIGH: "높음", MEDIUM: "보통", LOW: "낮음",
};
const DW_ICON: Record<string, string> = { DONE: "✅", IN_PROGRESS: "🔄", TODO: "⏳" };
const TYPE_STYLE: Record<string, string> = {
  EPIC: "bg-purple-100 text-purple-700",
  STORY: "bg-blue-100 text-blue-700",
  TASK: "bg-slate-100 text-slate-600",
};

function FlatRow({
  issue,
  projectId,
  members,
  boardStatuses,
  allFlat,
  onRefresh,
}: {
  issue: Issue;
  projectId: string;
  members: Member[];
  boardStatuses: BoardStatus[];
  allFlat: Issue[];
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteIssueMutation = useMutation({
    mutationFn: () =>
      apiFetch<void>(`/api/projects/${projectId}/issues/${issue.id}`, { method: "DELETE" }),
    onSuccess: () => {
      setDeleteOpen(false);
      onRefresh();
    },
  });

  const parentOptions = allFlat.map((i) => ({ id: i.id, title: i.title, type: i.type }));

  return (
    <>
      <div
        className="flex items-center gap-2 px-3 py-2 hover:bg-accent/30 rounded group cursor-pointer"
        onClick={() => router.push(`/projects/${projectId}/issues/${issue.id}`)}
      >
        <span className={cn("w-14 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 text-center", TYPE_STYLE[issue.type])}>
          {issue.type}
        </span>
        <span className="flex-1 text-sm truncate">{issue.title}</span>

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

        <div className="w-4 shrink-0 flex justify-center">
          <span className={cn("w-2 h-2 rounded-full", PRIORITY_DOT[issue.priority] ?? "bg-slate-300")}
            title={PRIORITY_LABELS[issue.priority]} />
        </div>

        <div className="w-16 shrink-0 text-right">
          {issue.dueDate && (
            <span className={cn("text-[10px]", new Date(issue.dueDate) < new Date() ? "text-red-500" : "text-muted-foreground")}>
              {new Date(issue.dueDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>

        <div className="w-6 shrink-0 flex justify-center">
          {issue.assignee ? (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
              style={{ backgroundColor: issue.assignee.color }}
              title={issue.assignee.name}
            >
              {issue.assignee.name[0]}
            </div>
          ) : (
            <div className="w-5 h-5" />
          )}
        </div>

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
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}>
                <Trash2 size={12} className="mr-2" />삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {editOpen && (
        <IssueFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          projectId={projectId}
          members={members}
          boardStatuses={boardStatuses}
          parentOptions={parentOptions}
          initial={{
            id: issue.id, type: issue.type, title: issue.title,
            priority: issue.priority, assigneeId: issue.assignee?.id ?? "",
            boardStatusId: issue.boardStatus?.id ?? "",
            parentId: issue.parentId ?? "", epicColor: issue.epicColor ?? "",
          }}
          onSuccess={onRefresh}
        />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
              onClick={() => deleteIssueMutation.mutate()}
              disabled={deleteIssueMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteIssueMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "default", label: "기본순" },
  { value: "priority", label: "우선순위" },
  { value: "dueDate", label: "마감일" },
  { value: "createdAt", label: "최신순" },
];

export function IssuesPageClient({ projectId, initialIssues, members, boardStatuses }: Props) {
  const router = useRouter();
  const issues = initialIssues;
  const [viewMode, setViewMode] = useState<"tree" | "flat">("tree");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [filterType, setFilterType] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const allFlat = useMemo(() => flattenIssues(issues), [issues]);

  const hasActiveFilter = search || filterType || filterAssignee || filterPriority || filterStatus;

  const filteredTree = useMemo(() => {
    const predicate = (issue: Issue) => {
      const filters = { type: filterType, assigneeId: filterAssignee, priority: filterPriority, statusId: filterStatus };
      return (
        (search ? matchesSearch(issue, search) : true) &&
        matchesFilters(issue, filters)
      );
    };
    return filterTree(issues, predicate);
  }, [issues, search, filterType, filterAssignee, filterPriority, filterStatus]);

  const filteredFlat = useMemo(() => {
    const filters = { type: filterType, assigneeId: filterAssignee, priority: filterPriority, statusId: filterStatus };
    const base = allFlat.filter(
      (issue) =>
        (search ? matchesSearch(issue, search) : true) &&
        matchesFilters(issue, filters)
    );
    return sortBy !== "default" ? sortFlat(base, sortBy) : base;
  }, [allFlat, search, filterType, filterAssignee, filterPriority, filterStatus, sortBy]);

  const parentOptions = allFlat.map((i) => ({ id: i.id, title: i.title, type: i.type }));

  function clearFilters() {
    setSearch("");
    setFilterType("");
    setFilterAssignee("");
    setFilterPriority("");
    setFilterStatus("");
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
      {/* 상단 툴바 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 검색 */}
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="이슈 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>

        {/* 필터들 */}
        <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="타입" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 타입</SelectItem>
            <SelectItem value="EPIC">EPIC</SelectItem>
            <SelectItem value="STORY">STORY</SelectItem>
            <SelectItem value="TASK">TASK</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority || "all"} onValueChange={(v) => setFilterPriority(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="우선순위" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 우선순위</SelectItem>
            <SelectItem value="URGENT">긴급</SelectItem>
            <SelectItem value="HIGH">높음</SelectItem>
            <SelectItem value="MEDIUM">보통</SelectItem>
            <SelectItem value="LOW">낮음</SelectItem>
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

        <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            {boardStatuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={clearFilters}>
            <X size={12} className="mr-1" />
            필터 초기화
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1">
          {/* 정렬 (플랫 뷰에서만 의미 있음) */}
          {viewMode === "flat" && (
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* 뷰 전환 */}
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "tree" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-none px-2.5 text-xs"
              onClick={() => setViewMode("tree")}
              title="트리 뷰"
            >
              <ChevronRight size={14} className="mr-1" />
              트리
            </Button>
            <Button
              variant={viewMode === "flat" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-none px-2.5 text-xs border-l"
              onClick={() => setViewMode("flat")}
              title="플랫 뷰"
            >
              <LayoutList size={14} className="mr-1" />
              플랫
            </Button>
          </div>

          <Button size="sm" className="h-8" onClick={() => setAddOpen(true)}>
            이슈 만들기
          </Button>
        </div>
      </div>

      {/* 필터 결과 수 */}
      {hasActiveFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {viewMode === "flat" ? filteredFlat.length : flattenIssues(filteredTree).length}개 결과
          </span>
          {search && (
            <Badge variant="secondary" className="text-xs">
              "{search}"
            </Badge>
          )}
        </div>
      )}

      {/* 뷰 렌더링 */}
      {viewMode === "tree" ? (
        <IssueTree
          projectId={projectId}
          issues={filteredTree}
          members={members}
          boardStatuses={boardStatuses}
          onRefresh={refresh}
          hideAddButton
        />
      ) : (
        <div className="border rounded-lg">
          {/* 헤더 */}
          <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 text-xs text-muted-foreground font-medium">
            <span className="w-14 shrink-0">타입</span>
            <span className="flex-1">제목</span>
            <span className="w-24 text-center shrink-0">직군</span>
            <span className="w-20 text-center shrink-0">상태</span>
            <span className="w-4 shrink-0" />
            <span className="w-16 text-right shrink-0">마감일</span>
            <span className="w-6 text-center shrink-0">담당</span>
            <span className="w-6 shrink-0" />
          </div>

          {filteredFlat.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {hasActiveFilter ? "필터 조건에 맞는 이슈가 없습니다." : "이슈가 없습니다."}
            </div>
          ) : (
            <div className="py-1">
              {filteredFlat.map((issue) => (
                <FlatRow
                  key={issue.id}
                  issue={issue}
                  projectId={projectId}
                  members={members}
                  boardStatuses={boardStatuses}
                  allFlat={allFlat}
                  onRefresh={refresh}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {addOpen && (
        <IssueFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          projectId={projectId}
          members={members}
          boardStatuses={boardStatuses}
          parentOptions={parentOptions}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
