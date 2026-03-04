import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string; disciplineId: string }> };

const schema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { disciplineId } = await params;
    const body = await request.json();
    const data = schema.parse(body);

    const discipline = await db.discipline.update({
      where: { id: disciplineId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
    return NextResponse.json(discipline);
  } catch {
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { disciplineId } = await params;
    await db.discipline.delete({ where: { id: disciplineId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
