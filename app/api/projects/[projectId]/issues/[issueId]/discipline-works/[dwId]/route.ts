import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string; issueId: string; dwId: string }> };

const schema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  assigneeId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId, issueId, dwId } = await params;
    const body = await request.json();
    const data = schema.parse(body);

    const dw = await db.disciplineWork.update({
      where: { id: dwId },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: { discipline: true },
    });

    // 직군 작업이 IN_PROGRESS로 변경 → "할 일" 상태의 이슈를 "진행 중"으로 자동 이동
    if (data.status === "IN_PROGRESS") {
      const issue = await db.issue.findUnique({ where: { id: issueId }, select: { boardStatusId: true } });
      if (issue?.boardStatusId) {
        const firstStatus = await db.boardStatus.findFirst({
          where: { projectId },
          orderBy: { order: "asc" },
        });
        // 첫 번째 상태(할 일)에 있을 때만 자동 이동
        if (firstStatus && issue.boardStatusId === firstStatus.id) {
          const inProgressStatus = await db.boardStatus.findFirst({
            where: { projectId, order: { gt: firstStatus.order }, isFinal: false },
            orderBy: { order: "asc" },
          });
          if (inProgressStatus) {
            await db.issue.update({
              where: { id: issueId },
              data: { boardStatusId: inProgressStatus.id },
            });
            await db.activityLog.create({
              data: {
                issueId,
                actionType: "AUTO_COMPLETED",
                newValue: `직군 진행 시작 → ${inProgressStatus.name}`,
              },
            });
          }
        }
      }
    }

    // 담당자가 지정된 직군 작업이 모두 DONE → 이슈 자동 완료
    // 담당자가 없는 직군 작업은 무시 (불필요한 직군으로 간주)
    if (data.status === "DONE") {
      const allWorks = await db.disciplineWork.findMany({ where: { issueId } });
      const assignedWorks = allWorks.filter((w) => w.assigneeId !== null);
      const allDone = assignedWorks.length > 0 && assignedWorks.every((w) => w.status === "DONE");

      if (allDone) {
        const finalStatus = await db.boardStatus.findFirst({
          where: { project: { issues: { some: { id: issueId } } }, isFinal: true },
          orderBy: { order: "asc" },
        });
        if (finalStatus) {
          await db.issue.update({
            where: { id: issueId },
            data: { boardStatusId: finalStatus.id },
          });
          await db.activityLog.create({
            data: {
              issueId,
              actionType: "AUTO_COMPLETED",
              newValue: `모든 직군 완료 → ${finalStatus.name}`,
            },
          });
        }
      }
    }

    await db.activityLog.create({
      data: {
        issueId,
        actionType: "DISCIPLINE_UPDATED",
        newValue: `${dw.discipline.name}: ${data.status ?? "업데이트"}`,
      },
    });

    return NextResponse.json(dw);
  } catch {
    return NextResponse.json({ error: "직군 작업 수정에 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { dwId } = await params;
    await db.disciplineWork.delete({ where: { id: dwId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "직군 작업 삭제에 실패했습니다." }, { status: 500 });
  }
}
