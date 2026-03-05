"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { ExternalLink, Send, Clock, User, Loader2, X as XIcon, Trash2 } from "lucide-react";
import { PriorityIcon } from "@/components/shared/PriorityIcon";
import { useQueryClient } from "@tanstack/react-query";
import { useIssueDetail } from "@/lib/hooks/use-issue-detail";
import {
  useUpdateIssueField,
  useAddComment,
  useAddDisciplineWork,
  useUpdateDisciplineWork,
  useDeleteDisciplineWork,
  useDeleteIssue,
} from "@/lib/hooks/use-issue-detail";
import { AttachmentSection } from "./AttachmentSection";

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: "긴급",
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};
const DW_STATUS_LABELS: Record<string, string> = {
  TODO: "할 일",
  IN_PROGRESS: "진행 중",
  DONE: "완료",
};
const ACTION_LABELS: Record<string, string> = {
  STATUS_CHANGED: "상태 변경",
  ASSIGNEE_CHANGED: "담당자 변경",
  PRIORITY_CHANGED: "우선순위 변경",
  TITLE_CHANGED: "제목 변경",
  DUE_DATE_CHANGED: "마감일 변경",
  SPRINT_ASSIGNED: "스프린트 배정",
  COMMENT_ADDED: "댓글 추가",
  AUTO_COMPLETED: "자동 완료",
  DISCIPLINE_UPDATED: "직군 업데이트",
};

type Member = { id: string; name: string; color: string };
type BoardStatus = { id: string; name: string; color: string; isFinal?: boolean };
type Discipline = { id: string; name: string; color: string; order: number };

type DisciplineWork = {
  id: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  notes: string | null;
  discipline: Discipline;
  assignee: Member | null;
};

type Comment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
};

type ActivityLog = {
  id: string;
  actionType: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  member: { id: string; name: string } | null;
};

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType?: string | null;
};

type ChildIssue = {
  id: string;
  type: "EPIC" | "STORY" | "TASK";
  title: string;
  boardStatus: BoardStatus | null;
  assignee: Member | null;
};

type IssueDetail = {
  id: string;
  type: "EPIC" | "STORY" | "TASK";
  title: string;
  description: string | null;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  epicColor: string | null;
  dueDate: string | null;
  reporterName: string | null;
  labels: string[];
  assignee: Member | null;
  boardStatus: BoardStatus | null;
  parent: { id: string; title: string; type: string; epicColor: string | null } | null;
  children: ChildIssue[];
  disciplineWorks: DisciplineWork[];
  attachments: Attachment[];
  comments: Comment[];
  activityLogs: ActivityLog[];
  sprint: { id: string; name: string } | null;
  disciplines: Discipline[];
  members: Member[];
  boardStatuses: BoardStatus[];
};

type Props = {
  projectId: string;
  issueId: string | null;
  onClose: () => void;
};

export function IssueDetailSheet({ projectId, issueId, onClose }: Props) {
  const { data, isLoading } = useIssueDetail(projectId, issueId);
  const issue = data as IssueDetail | undefined;

  return (
    <Sheet open={!!issueId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0" showCloseButton={false}>
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <SheetTitle className="sr-only">이슈 상세</SheetTitle>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {issue && (
          <SheetIssueContent projectId={projectId} issue={issue} onClose={onClose} />
        )}
        {!isLoading && !issue && (
          <SheetTitle className="sr-only">이슈 상세</SheetTitle>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetIssueContent({ projectId, issue, onClose }: { projectId: string; issue: IssueDetail; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const updateIssueField = useUpdateIssueField(projectId, issue.id);
  const addComment = useAddComment(projectId, issue.id);
  const addDisciplineWork = useAddDisciplineWork(projectId, issue.id);
  const updateDisciplineWork = useUpdateDisciplineWork(projectId, issue.id);
  const deleteDisciplineWork = useDeleteDisciplineWork(projectId, issue.id);
  const deleteIssue = useDeleteIssue(projectId, issue.id);

  const usedDisciplineIds = new Set(issue.disciplineWorks.map((dw) => dw.discipline.id));
  const availableDisciplines = issue.disciplines.filter((d) => !usedDisciplineIds.has(d.id));

  function handleSubmitComment() {
    if (!commentText.trim()) return;
    addComment.mutate(
      { authorName: commentAuthor || "익명", content: commentText },
      { onSuccess: () => setCommentText("") }
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <SheetHeader className="px-6 pt-6 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              issue.type === "EPIC"
                ? "text-white"
                : issue.type === "STORY"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            }`} style={issue.type === "EPIC" ? { backgroundColor: issue.epicColor ?? "#6366f1" } : undefined}>
              {issue.type}
            </span>
            <SheetTitle className="text-lg">{issue.title}</SheetTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/projects/${projectId}/issues/${issue.id}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="전체 보기"
            >
              <ExternalLink size={16} />
            </Link>
            <button
              onClick={() => setDeleteOpen(true)}
              className="text-muted-foreground hover:text-red-500 transition-colors"
              title="이슈 삭제"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <XIcon size={16} />
              <span className="sr-only">닫기</span>
            </button>
          </div>
        </div>
      </SheetHeader>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* 사이드바 정보 (수평 배치) */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* 상태 */}
          {issue.type !== "EPIC" && (
            <div>
              <SectionLabel>상태</SectionLabel>
              <Select
                value={issue.boardStatus?.id ?? ""}
                onValueChange={(v) => updateIssueField.mutate({ boardStatusId: v })}
                disabled={updateIssueField.isPending}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="상태 없음" />
                </SelectTrigger>
                <SelectContent>
                  {issue.boardStatuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 담당자 */}
          <div>
            <SectionLabel>담당자</SectionLabel>
            <Select
              value={issue.assignee?.id ?? "none"}
              onValueChange={(v) => updateIssueField.mutate({ assigneeId: v === "none" ? null : v })}
              disabled={updateIssueField.isPending}
            >
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue placeholder="담당자 없음" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">없음</SelectItem>
                {issue.members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 우선순위 */}
          <div>
            <SectionLabel>우선순위</SectionLabel>
            <Select
              value={issue.priority}
              onValueChange={(v) => updateIssueField.mutate({ priority: v })}
              disabled={updateIssueField.isPending}
            >
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="flex items-center gap-1.5">
                      <PriorityIcon priority={p} size={12} />
                      {PRIORITY_LABELS[p]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 마감일 */}
          <div>
            <SectionLabel>마감일</SectionLabel>
            <input
              type="date"
              className="mt-1 h-8 w-full text-xs border rounded px-2 py-1"
              value={issue.dueDate ? new Date(issue.dueDate).toISOString().split("T")[0] : ""}
              onChange={(e) => {
                const val = e.target.value;
                updateIssueField.mutate({ dueDate: val || null });
              }}
              disabled={updateIssueField.isPending}
            />
          </div>

          {/* 스프린트 */}
          {issue.sprint && (
            <div>
              <SectionLabel>스프린트</SectionLabel>
              <p className="text-xs mt-1">{issue.sprint.name}</p>
            </div>
          )}

          {/* 작성자 */}
          {issue.reporterName && (
            <div>
              <SectionLabel>작성자</SectionLabel>
              <p className="text-xs mt-1 flex items-center gap-1">
                <User size={12} />
                {issue.reporterName}
              </p>
            </div>
          )}
        </div>

        {/* 레이블 */}
        {issue.labels.length > 0 && (
          <div>
            <SectionLabel>레이블</SectionLabel>
            <div className="flex flex-wrap gap-1 mt-1">
              {issue.labels.map((l) => (
                <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* 설명 */}
        {issue.description && (
          <div>
            <SectionLabel>설명</SectionLabel>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap border rounded-md p-3 bg-muted/20 mt-1">
              {issue.description}
            </div>
          </div>
        )}

        {/* 하위 이슈 */}
        {issue.children.length > 0 && (
          <div>
            <SectionLabel>하위 이슈 ({issue.children.length})</SectionLabel>
            <div className="border rounded-md divide-y mt-1">
              {issue.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/projects/${projectId}/issues/${child.id}`}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-accent/30 text-sm"
                >
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    child.type === "STORY" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {child.type}
                  </span>
                  <span className="flex-1 truncate">{child.title}</span>
                  {child.boardStatus && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                      style={{ backgroundColor: child.boardStatus.color + "20", color: child.boardStatus.color }}>
                      {child.boardStatus.name}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 직군 체크리스트 (TASK만) */}
        {issue.type === "TASK" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>직군 작업</SectionLabel>
              {availableDisciplines.length > 0 && (
                <Select
                  onValueChange={(v) => addDisciplineWork.mutate(v)}
                  disabled={addDisciplineWork.isPending}
                >
                  <SelectTrigger className="h-7 text-xs w-32">
                    <SelectValue placeholder="+ 직군 추가" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDisciplines.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {issue.disciplineWorks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">직군 작업이 없습니다.</p>
            ) : (
              <div className="border rounded-md divide-y">
                {issue.disciplineWorks.map((dw) => (
                  <div key={dw.id} className="flex items-center gap-2 px-3 py-2">
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded shrink-0"
                      style={{ backgroundColor: dw.discipline.color + "20", color: dw.discipline.color }}
                    >
                      {dw.discipline.name}
                    </span>
                    <Select
                      value={dw.assignee?.id ?? "none"}
                      onValueChange={(v) =>
                        updateDisciplineWork.mutate({ dwId: dw.id, data: { assigneeId: v === "none" ? null : v } })
                      }
                      disabled={updateDisciplineWork.isPending}
                    >
                      <SelectTrigger className="h-6 text-xs w-24 shrink-0">
                        <SelectValue placeholder="담당 없음" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">없음</SelectItem>
                        {issue.members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={dw.status}
                      onValueChange={(v) =>
                        updateDisciplineWork.mutate({ dwId: dw.id, data: { status: v } })
                      }
                      disabled={updateDisciplineWork.isPending}
                    >
                      <SelectTrigger className="h-6 text-xs w-24 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
                          <SelectItem key={s} value={s}>{DW_STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto text-muted-foreground"
                      onClick={() => deleteDisciplineWork.mutate(dw.id)}
                      disabled={deleteDisciplineWork.isPending}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 파일 첨부 */}
        <AttachmentSection
          projectId={projectId}
          issueId={issue.id}
          attachments={issue.attachments}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ["projects", projectId, "issues", issue.id] })}
        />

        {/* 댓글 */}
        <div>
          <SectionLabel>댓글 ({issue.comments.length})</SectionLabel>
          <div className="space-y-3 mt-2 mb-3">
            {issue.comments.map((c) => (
              <div key={c.id} className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">{c.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <input
              className="w-full text-xs border rounded px-2 py-1"
              placeholder="이름 (선택)"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
            />
            <Textarea
              placeholder="댓글을 입력하세요..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={addComment.isPending || !commentText.trim()}
              >
                <Send size={12} className="mr-1" />
                {addComment.isPending ? "전송 중..." : "댓글 달기"}
              </Button>
            </div>
          </div>
        </div>

        {/* 활동 로그 */}
        {issue.activityLogs.length > 0 && (
          <div>
            <SectionLabel>활동 내역</SectionLabel>
            <div className="space-y-1 mt-2">
              {issue.activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Clock size={12} className="mt-0.5 shrink-0" />
                  <span>
                    {log.member?.name ?? "시스템"}이 <strong>{ACTION_LABELS[log.actionType] ?? log.actionType}</strong>
                    {log.oldValue && log.newValue && `: ${log.oldValue} → ${log.newValue}`}
                    {!log.oldValue && log.newValue && `: ${log.newValue}`}
                  </span>
                  <span className="ml-auto shrink-0">
                    {new Date(log.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이슈를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{issue.title}&quot; 이슈가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                deleteIssue.mutate(undefined, {
                  onSuccess: () => {
                    setDeleteOpen(false);
                    onClose();
                  },
                });
              }}
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground">{children}</p>;
}
