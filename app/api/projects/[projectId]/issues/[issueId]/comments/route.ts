import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendSlackNotification, getProjectWebhook } from "@/lib/notifications";

type Params = { params: Promise<{ projectId: string; issueId: string }> };

const schema = z.object({
  authorName: z.string().min(1).max(50),
  content: z.string().min(1).max(5000),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { issueId, projectId } = await params;
    const body = await request.json();
    const data = schema.parse(body);

    const [comment, issue] = await Promise.all([
      db.comment.create({
        data: { issueId, authorName: data.authorName, content: data.content },
      }),
      db.issue.findUnique({
        where: { id: issueId },
        select: {
          title: true,
          assignee: { select: { id: true, name: true, slackUserId: true } },
        },
      }),
    ]);

    await db.activityLog.create({
      data: { issueId, actionType: "COMMENT_ADDED", newValue: data.authorName },
    });

    // Slack 알림: 담당자에게 댓글 알림
    if (issue) {
      const webhookUrl = await getProjectWebhook(projectId);
      if (webhookUrl) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        const preview = data.content.length > 80 ? data.content.slice(0, 80) + "..." : data.content;
        void sendSlackNotification({
          webhookUrl,
          issueTitle: issue.title,
          issueUrl: `${baseUrl}/projects/${projectId}/issues/${issueId}`,
          message: `*${data.authorName}*이 댓글을 달았습니다:\n> ${preview}`,
          mentionSlackId: issue.assignee?.slackUserId ?? null,
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "댓글 등록에 실패했습니다." }, { status: 500 });
  }
}
