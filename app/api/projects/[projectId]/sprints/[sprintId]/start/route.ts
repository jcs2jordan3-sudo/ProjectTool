import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ projectId: string; sprintId: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { projectId, sprintId } = await params;

    // 이미 활성 스프린트가 있는지 확인
    const active = await db.sprint.findFirst({
      where: { projectId, status: "ACTIVE" },
    });
    if (active) {
      return NextResponse.json(
        { error: "이미 활성 스프린트가 있습니다. 먼저 완료하세요." },
        { status: 400 }
      );
    }

    const sprint = await db.sprint.update({
      where: { id: sprintId, projectId },
      data: { status: "ACTIVE" },
    });

    return NextResponse.json(sprint);
  } catch {
    return NextResponse.json({ error: "스프린트 시작 실패" }, { status: 500 });
  }
}
