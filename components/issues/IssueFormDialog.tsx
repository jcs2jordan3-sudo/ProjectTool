"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EPIC_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
];

type IssueType = "EPIC" | "STORY" | "TASK";
type Priority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

type Member = { id: string; name: string; color: string };
type BoardStatus = { id: string; name: string; color: string };
type ParentOption = { id: string; title: string; type: IssueType };

type FormData = {
  type: IssueType;
  title: string;
  description: string;
  priority: Priority;
  assigneeId: string;
  boardStatusId: string;
  parentId: string;
  epicColor: string;
  dueDate: string;
  reporterName: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultType?: IssueType;
  defaultParentId?: string;
  members: Member[];
  boardStatuses: BoardStatus[];
  parentOptions: ParentOption[];
  initial?: Partial<FormData> & { id?: string };
  onSuccess: () => void;
};

const TYPE_LABELS: Record<IssueType, string> = { EPIC: "에픽", STORY: "스토리", TASK: "태스크" };
const PRIORITY_LABELS: Record<Priority, string> = { URGENT: "긴급", HIGH: "높음", MEDIUM: "보통", LOW: "낮음" };

export function IssueFormDialog({
  open, onOpenChange, projectId, defaultType = "TASK",
  defaultParentId, members, boardStatuses, parentOptions,
  initial, onSuccess,
}: Props) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<FormData>({
    type: initial?.type ?? defaultType,
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    priority: initial?.priority ?? "MEDIUM",
    assigneeId: initial?.assigneeId ?? "",
    boardStatusId: initial?.boardStatusId ?? (boardStatuses[0]?.id ?? ""),
    parentId: initial?.parentId ?? defaultParentId ?? "",
    epicColor: initial?.epicColor ?? EPIC_COLORS[0],
    dueDate: initial?.dueDate ?? "",
    reporterName: initial?.reporterName ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const filteredParents = parentOptions.filter((p) => {
    if (form.type === "STORY") return p.type === "EPIC";
    if (form.type === "TASK") return p.type === "EPIC" || p.type === "STORY";
    return false;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      type: form.type,
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      assigneeId: form.assigneeId || null,
      boardStatusId: form.type !== "EPIC" ? (form.boardStatusId || null) : null,
      parentId: form.type !== "EPIC" ? (form.parentId || null) : null,
      epicColor: form.type === "EPIC" ? form.epicColor : null,
      dueDate: form.dueDate || null,
      reporterName: form.reporterName || null,
    };

    try {
      const url = isEdit
        ? `/api/projects/${projectId}/issues/${initial!.id}`
        : `/api/projects/${projectId}/issues`;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "오류가 발생했습니다.");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "이슈 수정" : "이슈 만들기"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 타입 */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>타입 *</Label>
              <div className="flex gap-2">
                {(["EPIC", "STORY", "TASK"] as IssueType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`flex-1 py-1.5 text-xs rounded border transition-colors ${form.type === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                      }`}
                    onClick={() => update("type", t)}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Epic 색상 */}
          {form.type === "EPIC" && (
            <div className="space-y-1.5">
              <Label>에픽 색상</Label>
              <div className="flex gap-2 flex-wrap">
                {EPIC_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-7 h-7 rounded border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: form.epicColor === c ? "#000" : "transparent" }}
                    onClick={() => update("epicColor", c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 제목 */}
          <div className="space-y-1.5">
            <Label htmlFor="issue-title">제목 *</Label>
            <Input
              id="issue-title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="이슈 제목"
              required
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <Label htmlFor="issue-desc">설명</Label>
            <Textarea
              id="issue-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="이슈 설명"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 우선순위 */}
            <div className="space-y-1.5">
              <Label>우선순위</Label>
              <Select value={form.priority} onValueChange={(v) => update("priority", v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["URGENT", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 담당자 */}
            <div className="space-y-1.5">
              <Label>담당자</Label>
              <Select value={form.assigneeId || "none"} onValueChange={(v) => update("assigneeId", v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="없음" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 상태 (Epic 제외) */}
          {form.type !== "EPIC" && boardStatuses.length > 0 && (
            <div className="space-y-1.5">
              <Label>상태</Label>
              <Select value={form.boardStatusId} onValueChange={(v) => update("boardStatusId", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {boardStatuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 상위 이슈 (Epic 제외) */}
          {form.type !== "EPIC" && filteredParents.length > 0 && (
            <div className="space-y-1.5">
              <Label>상위 이슈</Label>
              <Select value={form.parentId || "none"} onValueChange={(v) => update("parentId", v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="없음" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  {filteredParents.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      [{TYPE_LABELS[p.type]}] {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 마감일 */}
          <div className="space-y-1.5">
            <Label htmlFor="issue-due">마감일</Label>
            <Input
              id="issue-due"
              type="date"
              value={form.dueDate}
              onChange={(e) => update("dueDate", e.target.value)}
            />
          </div>

          {/* 작성자 */}
          <div className="space-y-1.5">
            <Label htmlFor="issue-reporter">작성자 이름</Label>
            <Input
              id="issue-reporter"
              value={form.reporterName}
              onChange={(e) => update("reporterName", e.target.value)}
              placeholder="홍길동"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : isEdit ? "수정" : "만들기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
