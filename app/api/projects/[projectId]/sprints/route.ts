import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string }> };

const createSchema = z.object({
  name: z.string().min(1),
  goal: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export async function GET(_req: Request, { params }: Params) {
  const { projectId } = await params;

  const sprints = await db.sprint.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    include: {
      issues: {
        where: { type: { not: "EPIC" } },
        include: {
          assignee: { select: { id: true, name: true, color: true } },
          boardStatus: { select: { isFinal: true } },
        },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return NextResponse.json(sprints);
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const data = createSchema.parse(body);

    const sprint = await db.sprint.create({
      data: {
        projectId,
        name: data.name,
        goal: data.goal,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    return NextResponse.json(sprint, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력 오류" }, { status: 400 });
    }
    return NextResponse.json({ error: "스프린트 생성 실패" }, { status: 500 });
  }
}
