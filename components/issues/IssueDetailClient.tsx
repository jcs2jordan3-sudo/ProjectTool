"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, Send, Clock, User } from "lucide-react";
import { PriorityIcon } from "@/components/shared/PriorityIcon";
import { IssueFormDialog } from "./IssueFormDialog";
import { AttachmentSection } from "./AttachmentSection";
import {
  useUpdateIssueField,
  useAddComment,
  useAddDisciplineWork,
  useUpdateDisciplineWork,
  useDeleteDisciplineWork,
} from "@/lib/hooks/use-issue-detail";

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

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType?: string | null;
};

type Comment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date | string;
};

type ActivityLog = {
  id: string;
  actionType: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date | string;
  member: { id: string; name: string } | null;
};

type ChildIssue = {
  id: string;
  type: "EPIC" | "STORY" | "TASK";
  title: string;
  boardStatus: BoardStatus | null;
  assignee: Member | null;
};

type Issue = {
  id: string;
  type: "EPIC" | "STORY" | "TASK";
  title: string;
  description: string | null;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  epicColor: string | null;
  dueDate: Date | string | null;
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
};

type Props = {
  projectId: string;
  issue: Issue;
  members: Member[];
  boardStatuses: BoardStatus[];
  disciplines: Discipline[];
};

const PRIORITY_LABELS = { URGENT: "긴급", HIGH: "높음", MEDIUM: "보통", LOW: "낮음" };
const DW_STATUS_LABELS = { TODO: "할 일", IN_PROGRESS: "진행 중", DONE: "완료" };
const ACTION_LABELS: Record<string, string> = {
  STATUS_CHANGED: "상태 변경",
  ASSIGNEE_CHANGED: "담당자 변경",
  PRIORITY_CHANGED: "우선순위 변경",
  TITLE_CHANGED: "제목 변경",
  DUE_DATE_CHANGED: "마감일 변경",
  SPRINT_ASSIGNED: "스프린트 배정",
  COMMENT_ADDED: "댓글 추가",
};

export function IssueDetailClient({ projectId, issue, members, boardStatuses, disciplines }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");

  const updateIssueField = useUpdateIssueField(projectId, issue.id);
  const addComment = useAddComment(projectId, issue.id);
  const addDisciplineWork = useAddDisciplineWork(projectId, issue.id);
  const updateDisciplineWork = useUpdateDisciplineWork(projectId, issue.id);
  const deleteDisciplineWork = useDeleteDisciplineWork(projectId, issue.id);

  function handleSubmitComment() {
    if (!commentText.trim()) return;
    addComment.mutate(
      { authorName: commentAuthor || "익명", content: commentText },
      { onSuccess: () => setCommentText("") }
    );
  }

  const usedDisciplineIds = new Set(issue.disciplineWorks.map((dw) => dw.discipline.id));
  const availableDisciplines = disciplines.filter((d) => !usedDisciplineIds.has(d.id));

  const parentOptions = issue.parent
    ? [{ id: issue.parent.id, title: issue.parent.title, type: issue.parent.type as "EPIC" | "STORY" | "TASK" }]
    : [];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 max-w-5xl mx-auto">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
        <Link href={`/projects/${projectId}/issues`} className="hover:text-foreground">이슈</Link>
        {issue.parent && (
          <>
            <ChevronRight size={12} />
            <Link href={`/projects/${projectId}/issues/${issue.parent.id}`} className="hover:text-foreground">
              {issue.parent.title}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-foreground">{issue.title}</span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* 메인 컨텐츠 */}
        <div className="col-span-2 space-y-4">
          {/* 제목 */}
          <div>
            <div className="flex items-start gap-2">
              {issue.type === "EPIC" && (
                <span className="text-xs font-bold px-2 py-0.5 rounded text-white mt-1 shrink-0"
                  style={{ backgroundColor: issue.epicColor ?? "#6366f1" }}>
                  EPIC
                </span>
              )}
              {issue.type === "STORY" && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 mt-1 shrink-0">STORY</span>
              )}
              {issue.type === "TASK" && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 mt-1 shrink-0">TASK</span>
              )}
              <h1 className="text-xl font-semibold leading-snug">{issue.title}</h1>
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditOpen(true)}>
              이슈 수정
            </Button>
          </div>

          {/* 설명 */}
          {issue.description && (
            <div>
              <h3 className="text-sm font-medium mb-2">설명</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap border rounded-md p-3 bg-muted/20">
                {issue.description}
              </div>
            </div>
          )}

          {/* 하위 이슈 */}
          {issue.children.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">하위 이슈 ({issue.children.length})</h3>
              <div className="border rounded-md divide-y">
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
                <h3 className="text-sm font-medium">직군 작업</h3>
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
                          {members.map((m) => (
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
            onRefresh={() => router.refresh()}
          />

          {/* 댓글 */}
          <div>
            <h3 className="text-sm font-medium mb-3">댓글 ({issue.comments.length})</h3>
            <div className="space-y-3 mb-4">
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
              <h3 className="text-sm font-medium mb-2">활동 내역</h3>
              <div className="space-y-1">
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

        {/* 사이드바 */}
        <div className="space-y-3">
          {/* 상태 */}
          {issue.type !== "EPIC" && (
            <div>
              <Label className="text-xs text-muted-foreground">상태</Label>
              <Select
                value={issue.boardStatus?.id ?? ""}
                onValueChange={(v) => updateIssueField.mutate({ boardStatusId: v })}
                disabled={updateIssueField.isPending}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="상태 없음" />
                </SelectTrigger>
                <SelectContent>
                  {boardStatuses.map((s) => (
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
            <Label className="text-xs text-muted-foreground">담당자</Label>
            <Select
              value={issue.assignee?.id ?? "none"}
              onValueChange={(v) => updateIssueField.mutate({ assigneeId: v === "none" ? null : v })}
              disabled={updateIssueField.isPending}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="담당자 없음" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">없음</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 우선순위 */}
          <div>
            <Label className="text-xs text-muted-foreground">우선순위</Label>
            <Select
              value={issue.priority}
              onValueChange={(v) => updateIssueField.mutate({ priority: v })}
              disabled={updateIssueField.isPending}
            >
              <SelectTrigger className="mt-1">
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

          {/* 스프린트 */}
          {issue.sprint && (
            <div>
              <Label className="text-xs text-muted-foreground">스프린트</Label>
              <p className="text-sm mt-1">{issue.sprint.name}</p>
            </div>
          )}

          {/* 마감일 */}
          {issue.dueDate && (
            <div>
              <Label className="text-xs text-muted-foreground">마감일</Label>
              <p className="text-sm mt-1 flex items-center gap-1">
                <Clock size={12} />
                {new Date(issue.dueDate).toLocaleDateString("ko-KR")}
              </p>
            </div>
          )}

          {/* 작성자 */}
          {issue.reporterName && (
            <div>
              <Label className="text-xs text-muted-foreground">작성자</Label>
              <p className="text-sm mt-1 flex items-center gap-1">
                <User size={12} />
                {issue.reporterName}
              </p>
            </div>
          )}

          {/* 레이블 */}
          {issue.labels.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">레이블</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {issue.labels.map((l) => (
                  <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
                ))}
              </div>
            </div>
          )}
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
            id: issue.id,
            type: issue.type,
            title: issue.title,
            description: issue.description ?? "",
            priority: issue.priority,
            assigneeId: issue.assignee?.id ?? "",
            boardStatusId: issue.boardStatus?.id ?? "",
            parentId: issue.parent?.id ?? "",
            epicColor: issue.epicColor ?? "",
            dueDate: issue.dueDate ? new Date(issue.dueDate).toISOString().split("T")[0] : "",
            reporterName: issue.reporterName ?? "",
          }}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={`font-medium ${className ?? ""}`}>{children}</p>;
}
