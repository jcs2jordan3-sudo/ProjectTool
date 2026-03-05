"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#0ea5e9", "#64748b",
];

type MemberFormData = {
  name: string;
  email: string;
  color: string;
  slackUserId: string;
};

type MemberPayload = {
  name: string;
  email: string;
  color: string;
  slackUserId: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<MemberFormData> & { id?: string };
  onSuccess: () => void;
};

export function MemberFormDialog({ open, onOpenChange, initial, onSuccess }: Props) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<MemberFormData>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    color: initial?.color ?? "#6366f1",
    slackUserId: initial?.slackUserId ?? "",
  });
  const [error, setError] = useState("");

  const update = (field: keyof MemberFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const mutation = useMutation({
    mutationFn: (payload: MemberPayload) => {
      const url = isEdit ? `/api/members/${initial!.id}` : "/api/members";
      const method = isEdit ? "PATCH" : "POST";
      return apiFetch<unknown>(url, {
        method,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("오류가 발생했습니다.");
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    mutation.mutate({
      name: form.name,
      email: form.email,
      color: form.color,
      slackUserId: form.slackUserId || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "팀원 수정" : "팀원 추가"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="홍길동"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">이메일 *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="hong@company.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>아바타 색상</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: form.color === c ? "#000" : "transparent",
                  }}
                  onClick={() => update("color", c)}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border border-border"
                title="직접 선택"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slackUserId">Slack User ID (선택)</Label>
            <Input
              id="slackUserId"
              value={form.slackUserId}
              onChange={(e) => update("slackUserId", e.target.value)}
              placeholder="U0123ABCDEF"
            />
            <p className="text-xs text-muted-foreground">
              슬랙에서 멘션할 때 사용됩니다. 프로필 메뉴 → Copy member ID
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "저장 중..." : isEdit ? "수정" : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
