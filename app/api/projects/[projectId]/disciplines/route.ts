import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string }> };

const schema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export async function GET(_req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const disciplines = await db.discipline.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(disciplines);
  } catch {
    return NextResponse.json({ error: "불러오기 실패" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const data = schema.parse(body);

    const last = await db.discipline.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
    });

    const discipline = await db.discipline.create({
      data: {
        projectId,
        name: data.name,
        color: data.color,
        order: (last?.order ?? -1) + 1,
      },
    });
    return NextResponse.json(discipline, { status: 201 });
  } catch {
    return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  }
}
