import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string }> };

const schema = z.object({
  orderedIds: z.array(z.string()),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { orderedIds } = schema.parse(body);

    await Promise.all(
      orderedIds.map((id, index) =>
        db.boardStatus.updateMany({
          where: { id, projectId },
          data: { order: index },
        })
      )
    );

    const statuses = await db.boardStatus.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(statuses);
  } catch {
    return NextResponse.json({ error: "순서 변경 실패" }, { status: 500 });
  }
}
