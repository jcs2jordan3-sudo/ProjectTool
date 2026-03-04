import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string }> };

const schema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6b7280"),
  isFinal: z.boolean().default(false),
});

export async function GET(_req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const statuses = await db.boardStatus.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(statuses);
  } catch {
    return NextResponse.json({ error: "불러오기 실패" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const data = schema.parse(body);

    const last = await db.boardStatus.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
    });

    const status = await db.boardStatus.create({
      data: {
        projectId,
        name: data.name,
        color: data.color,
        isFinal: data.isFinal,
        order: (last?.order ?? -1) + 1,
      },
    });
    return NextResponse.json(status, { status: 201 });
  } catch {
    return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  }
}
