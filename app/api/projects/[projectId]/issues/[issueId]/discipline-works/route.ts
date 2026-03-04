import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string; issueId: string }> };

const schema = z.object({
  disciplineId: z.string().min(1),
  assigneeId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { issueId } = await params;
    const body = await request.json();
    const data = schema.parse(body);

    const existing = await db.disciplineWork.findFirst({
      where: { issueId, disciplineId: data.disciplineId },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 추가된 직군입니다." }, { status: 409 });
    }

    const dw = await db.disciplineWork.create({
      data: {
        issueId,
        disciplineId: data.disciplineId,
        assigneeId: data.assigneeId ?? null,
        notes: data.notes ?? null,
      },
      include: { discipline: true, assignee: { select: { id: true, name: true, color: true } } },
    });

    await db.activityLog.create({
      data: { issueId, actionType: "DISCIPLINE_UPDATED", newValue: `${dw.discipline.name} 추가` },
    });

    return NextResponse.json(dw, { status: 201 });
  } catch {
    return NextResponse.json({ error: "직군 작업 추가에 실패했습니다." }, { status: 500 });
  }
}
