/**
 * Slack Incoming Webhook 알림 발송
 * MVP: 프로젝트별 채널 Webhook URL로 발송
 */

type SlackBlock =
  | { type: "section"; text: { type: "mrkdwn"; text: string } }
  | { type: "divider" }
  | { type: "context"; elements: { type: "mrkdwn"; text: string }[] };

export interface NotifyPayload {
  webhookUrl: string;
  issueTitle: string;
  issueUrl: string;
  message: string;         // 본문 (담당자, 상태 등)
  mentionSlackId?: string | null; // @멘션할 slack_user_id
}

export async function sendSlackNotification(payload: NotifyPayload): Promise<void> {
  const { webhookUrl, issueTitle, issueUrl, message, mentionSlackId } = payload;

  const mention = mentionSlackId ? `<@${mentionSlackId}> ` : "";

  const blocks: SlackBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${mention}*<${issueUrl}|${issueTitle}>*\n${message}`,
      },
    },
  ];

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
  } catch (err) {
    console.error("Slack 알림 발송 실패:", err);
  }
}

/**
 * 프로젝트의 Slack Webhook URL 가져오기
 */
export async function getProjectWebhook(projectId: string): Promise<string | null> {
  const { db } = await import("@/lib/db");
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { slackWebhook: true },
  });
  return project?.slackWebhook ?? null;
}
