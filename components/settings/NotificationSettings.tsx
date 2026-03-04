"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Send } from "lucide-react";

type Props = {
  projectId: string;
  initialWebhook?: string | null;
};

export function NotificationSettings({ projectId, initialWebhook }: Props) {
  const [webhook, setWebhook] = useState(initialWebhook ?? "");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "error">("idle");
  const [testStatus, setTestStatus] = useState<"idle" | "ok" | "error">("idle");

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slackWebhook: webhook || null }),
    });
    setSaving(false);
    setSaveStatus(res.ok ? "ok" : "error");
    setTimeout(() => setSaveStatus("idle"), 3000);
  }

  async function handleTest() {
    if (!webhook) return;
    setTesting(true);
    setTestStatus("idle");
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "🔔 Webserive 테스트 알림입니다. Webhook이 정상적으로 연결되었습니다!",
        }),
      });
      setTestStatus(res.ok ? "ok" : "error");
    } catch {
      setTestStatus("error");
    }
    setTesting(false);
    setTimeout(() => setTestStatus("idle"), 4000);
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Slack Webhook */}
      <div className="border rounded-lg p-5 space-y-4">
        <div>
          <h4 className="font-medium text-sm">Slack Incoming Webhook</h4>
          <p className="text-xs text-muted-foreground mt-1">
            담당자 지정, 상태 변경, 댓글 등록 시 슬랙 채널에 알림을 보냅니다.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="webhook">Webhook URL</Label>
          <Input
            id="webhook"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            슬랙 앱 → Incoming Webhooks → 채널 선택 후 URL을 복사하세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "저장 중..." : "저장"}
          </Button>
          {webhook && (
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testing} className="gap-1.5">
              <Send size={12} />
              {testing ? "전송 중..." : "테스트 전송"}
            </Button>
          )}
          {saveStatus === "ok" && (
            <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
              <CheckCircle size={11} />저장됨
            </Badge>
          )}
          {saveStatus === "error" && (
            <Badge variant="outline" className="text-red-500 border-red-300 gap-1">
              <XCircle size={11} />저장 실패
            </Badge>
          )}
          {testStatus === "ok" && (
            <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
              <CheckCircle size={11} />전송 성공
            </Badge>
          )}
          {testStatus === "error" && (
            <Badge variant="outline" className="text-red-500 border-red-300 gap-1">
              <XCircle size={11} />전송 실패
            </Badge>
          )}
        </div>
      </div>

      {/* 알림 발송 조건 안내 */}
      <div className="border rounded-lg p-5">
        <h4 className="font-medium text-sm mb-3">알림 발송 조건</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span><strong className="text-foreground">담당자 지정</strong> — 이슈에 담당자가 배정될 때. 해당 담당자의 slack_user_id가 등록되어 있으면 @멘션 추가</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span><strong className="text-foreground">상태 변경</strong> — 이슈가 다른 컬럼으로 이동될 때</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span><strong className="text-foreground">댓글 등록</strong> — 이슈에 댓글이 달릴 때. 담당자에게 @멘션</span>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-4 border-t pt-3">
          팀원의 slack_user_id는 <strong>설정 → 팀원 관리</strong>에서 등록할 수 있습니다.
          슬랙 프로필 → 더보기 → 멤버 ID 복사 (예: U0123ABC)
        </p>
      </div>
    </div>
  );
}
