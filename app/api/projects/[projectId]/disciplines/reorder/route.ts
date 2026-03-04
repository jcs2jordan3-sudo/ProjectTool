import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string }> };

const schema = z.object({ orderedIds: z.array(z.string()) });

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const { orderedIds } = schema.parse(await request.json());

    await Promise.all(
      orderedIds.map((id, index) =>
        db.discipline.updateMany({ where: { id, projectId }, data: { order: index } })
      )
    );

    const disciplines = await db.discipline.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(disciplines);
  } catch {
    return NextResponse.json({ error: "순서 변경 실패" }, { status: 500 });
  }
}
