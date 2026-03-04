import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string; statusId: string }> };

const schema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isFinal: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { statusId } = await params;
    const body = await request.json();
    const data = schema.parse(body);

    const status = await db.boardStatus.update({
      where: { id: statusId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.isFinal !== undefined && { isFinal: data.isFinal }),
      },
    });
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { statusId, projectId } = await params;

    // 해당 상태 이슈를 null로 초기화
    await db.issue.updateMany({
      where: { projectId, boardStatusId: statusId },
      data: { boardStatusId: null },
    });

    await db.boardStatus.delete({ where: { id: statusId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
