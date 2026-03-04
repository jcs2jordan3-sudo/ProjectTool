"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProjectFormData = {
  name: string;
  description: string;
  slackWebhook: string;
};

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
  const [loading, setLoading] = useState(false);

  const update = (field: keyof ProjectFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name: form.name,
      description: form.description || null,
      slackWebhook: form.slackWebhook || null,
    };

    try {
      const url = isEdit ? `/api/projects/${initial!.id}` : "/api/projects";
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

      const project = await res.json();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(project.id);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
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
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : isEdit ? "수정" : "만들기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
