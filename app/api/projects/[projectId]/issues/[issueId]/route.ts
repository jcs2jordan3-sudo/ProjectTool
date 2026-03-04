import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateIssueSchema } from "@/lib/validations/issue";
import { ZodError } from "zod";
import { ActivityAction } from "@/app/generated/prisma/client";
import { sendSlackNotification, getProjectWebhook } from "@/lib/notifications";

type Params = { params: Promise<{ projectId: string; issueId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { issueId } = await params;
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        assignee: { select: { id: true, name: true, color: true } },
        boardStatus: true,
        parent: { select: { id: true, title: true, type: true, epicColor: true } },
        children: {
          include: {
            assignee: { select: { id: true, name: true, color: true } },
            boardStatus: { select: { id: true, name: true, color: true, isFinal: true } },
          },
          orderBy: { order: "asc" },
        },
        disciplineWorks: {
          include: {
            discipline: true,
            assignee: { select: { id: true, name: true, color: true } },
          },
          orderBy: { order: "asc" },
        },
        comments: { orderBy: { createdAt: "asc" } },
        attachments: { orderBy: { createdAt: "desc" } },
        activityLogs: {
          include: { member: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        sprint: { select: { id: true, name: true } },
      },
    });
    if (!issue) return NextResponse.json({ error: "이슈를 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json(issue);
  } catch {
    return NextResponse.json({ error: "이슈를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { issueId, projectId } = await params;
    const body = await request.json();
    const data = updateIssueSchema.parse(body);

    const prev = await db.issue.findUnique({ where: { id: issueId } });
    if (!prev) return NextResponse.json({ error: "이슈를 찾을 수 없습니다." }, { status: 404 });

    const updated = await db.issue.update({
      where: { id: issueId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.boardStatusId !== undefined && { boardStatusId: data.boardStatusId }),
        ...(data.sprintId !== undefined && { sprintId: data.sprintId }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.reporterName !== undefined && { reporterName: data.reporterName }),
        ...(data.labels !== undefined && { labels: data.labels }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.epicColor !== undefined && { epicColor: data.epicColor }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
      include: {
        assignee: { select: { id: true, name: true, color: true } },
        boardStatus: true,
      },
    });

    // 활동 로그
    type LogInput = { issueId: string; actionType: ActivityAction; oldValue?: string | null; newValue?: string | null };
    const logs: LogInput[] = [];

    if (data.boardStatusId !== undefined && data.boardStatusId !== prev.boardStatusId) {
      const [oldStatus, newStatus] = await Promise.all([
        prev.boardStatusId ? db.boardStatus.findUnique({ where: { id: prev.boardStatusId } }) : null,
        data.boardStatusId ? db.boardStatus.findUnique({ where: { id: data.boardStatusId } }) : null,
      ]);
      logs.push({
        issueId,
        actionType: ActivityAction.STATUS_CHANGED,
        oldValue: oldStatus?.name ?? null,
        newValue: newStatus?.name ?? null,
      });
    }
    if (data.assigneeId !== undefined && data.assigneeId !== prev.assigneeId) {
      const [oldA, newA] = await Promise.all([
        prev.assigneeId ? db.member.findUnique({ where: { id: prev.assigneeId } }) : null,
        data.assigneeId ? db.member.findUnique({ where: { id: data.assigneeId } }) : null,
      ]);
      logs.push({
        issueId,
        actionType: ActivityAction.ASSIGNEE_CHANGED,
        oldValue: oldA?.name ?? null,
        newValue: newA?.name ?? null,
      });
    }
    if (data.priority !== undefined && data.priority !== prev.priority) {
      logs.push({ issueId, actionType: ActivityAction.PRIORITY_CHANGED, oldValue: prev.priority, newValue: data.priority });
    }
    if (data.title !== undefined && data.title !== prev.title) {
      logs.push({ issueId, actionType: ActivityAction.TITLE_CHANGED, oldValue: prev.title, newValue: data.title });
    }
    if (data.dueDate !== undefined) {
      const newDate = data.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : null;
      const oldDate = prev.dueDate ? prev.dueDate.toISOString().split("T")[0] : null;
      if (newDate !== oldDate) {
        logs.push({ issueId, actionType: ActivityAction.DUE_DATE_CHANGED, oldValue: oldDate, newValue: newDate });
      }
    }
    if (data.sprintId !== undefined && data.sprintId !== prev.sprintId) {
      const newSprint = data.sprintId ? await db.sprint.findUnique({ where: { id: data.sprintId } }) : null;
      logs.push({ issueId, actionType: ActivityAction.SPRINT_ASSIGNED, oldValue: null, newValue: newSprint?.name ?? null });
    }

    if (logs.length > 0) {
      await db.activityLog.createMany({ data: logs });
    }

    // Slack 알림: 담당자 변경 시
    if (data.assigneeId !== undefined && data.assigneeId !== prev.assigneeId && data.assigneeId) {
      const webhookUrl = await getProjectWebhook(projectId);
      if (webhookUrl) {
        const newAssignee = updated.assignee;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        void sendSlackNotification({
          webhookUrl,
          issueTitle: updated.title,
          issueUrl: `${baseUrl}/projects/${projectId}/issues/${issueId}`,
          message: `담당자가 *${newAssignee?.name ?? "알 수 없음"}*으로 지정되었습니다.`,
          mentionSlackId: await db.member
            .findUnique({ where: { id: data.assigneeId }, select: { slackUserId: true } })
            .then((m) => m?.slackUserId ?? null),
        });
      }
    }

    // Slack 알림: 상태 변경 시
    if (data.boardStatusId !== undefined && data.boardStatusId !== prev.boardStatusId) {
      const webhookUrl = await getProjectWebhook(projectId);
      if (webhookUrl) {
        const statusName = updated.boardStatus?.name ?? "알 수 없음";
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        void sendSlackNotification({
          webhookUrl,
          issueTitle: updated.title,
          issueUrl: `${baseUrl}/projects/${projectId}/issues/${issueId}`,
          message: `상태가 *${statusName}*으로 변경되었습니다.`,
          mentionSlackId: updated.assignee
            ? await db.member
                .findUnique({ where: { id: updated.assignee.id }, select: { slackUserId: true } })
                .then((m) => m?.slackUserId ?? null)
            : null,
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력 오류" }, { status: 400 });
    }
    return NextResponse.json({ error: "이슈 수정에 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { issueId } = await params;
    await db.issue.delete({ where: { id: issueId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "이슈 삭제에 실패했습니다." }, { status: 500 });
  }
}
