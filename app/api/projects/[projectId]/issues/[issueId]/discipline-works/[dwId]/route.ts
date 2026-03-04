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
    const { issueId, dwId } = await params;
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

    // 모든 직군 DONE → 이슈 자동 완료
    if (data.status === "DONE") {
      const allWorks = await db.disciplineWork.findMany({ where: { issueId } });
      const allDone = allWorks.every((w) => w.status === "DONE");

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
