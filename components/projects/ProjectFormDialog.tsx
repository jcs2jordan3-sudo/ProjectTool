"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiError } from "@/lib/api";

type ProjectFormData = {
  name: string;
  description: string;
  slackWebhook: string;
};

type ProjectPayload = {
  name: string;
  description: string | null;
  slackWebhook: string | null;
};

type ProjectResponse = { id: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<ProjectFormData> & { id?: string };
  onSuccess?: (id: string) => void;
};

export function ProjectFormDialog({ open, onOpenChange, initial, onSuccess }: Props) {
  const isEdit = Boolean(initial?.id);
  const router = useRouter();
  const [form, setForm] = useState<ProjectFormData>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    slackWebhook: initial?.slackWebhook ?? "",
  });
  const [error, setError] = useState("");

  const update = (field: keyof ProjectFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const mutation = useMutation({
    mutationFn: (payload: ProjectPayload) => {
      const url = isEdit ? `/api/projects/${initial!.id}` : "/api/projects";
      const method = isEdit ? "PATCH" : "POST";
      return apiFetch<ProjectResponse>(url, {
        method,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (project) => {
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(project.id);
      } else {
        router.refresh();
      }
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
      description: form.description || null,
      slackWebhook: form.slackWebhook || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "프로젝트 수정" : "새 프로젝트"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">프로젝트 이름 *</Label>
            <Input
              id="proj-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="신규 캐릭터 개발"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">설명</Label>
            <Textarea
              id="proj-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="프로젝트 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-slack">Slack Webhook URL (선택)</Label>
            <Input
              id="proj-slack"
              value={form.slackWebhook}
              onChange={(e) => update("slackWebhook", e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
            />
            <p className="text-xs text-muted-foreground">
              담당자 배정 등 알림을 받을 Slack 채널 Webhook URL
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "저장 중..." : isEdit ? "수정" : "만들기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
