import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string; sprintId: string }> };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  goal: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId, sprintId } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const sprint = await db.sprint.update({
      where: { id: sprintId, projectId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.goal !== undefined && { goal: data.goal }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
      },
    });

    return NextResponse.json(sprint);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력 오류" }, { status: 400 });
    }
    return NextResponse.json({ error: "스프린트 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { projectId, sprintId } = await params;

    // 스프린트 이슈를 백로그로 이동
    await db.issue.updateMany({
      where: { sprintId, projectId },
      data: { sprintId: null },
    });

    await db.sprint.delete({ where: { id: sprintId, projectId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sprint DELETE error:", error);
    return NextResponse.json({ error: "스프린트 삭제 실패" }, { status: 500 });
  }
}
