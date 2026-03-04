import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ projectId: string; sprintId: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { projectId, sprintId } = await params;

    // 미완료 이슈를 백로그로 이동 (isFinal이 아닌 상태)
    const issues = await db.issue.findMany({
      where: { sprintId, projectId },
      include: { boardStatus: { select: { isFinal: true } } },
    });

    const unfinishedIds = issues
      .filter((i) => !i.boardStatus?.isFinal)
      .map((i) => i.id);

    await db.$transaction([
      // 미완료 이슈 → 백로그
      db.issue.updateMany({
        where: { id: { in: unfinishedIds } },
        data: { sprintId: null },
      }),
      // 스프린트 완료 처리
      db.sprint.update({
        where: { id: sprintId, projectId },
        data: { status: "COMPLETED" },
      }),
    ]);

    return NextResponse.json({ ok: true, movedToBacklog: unfinishedIds.length });
  } catch (error) {
    console.error("Sprint complete error:", error);
    return NextResponse.json({ error: "스프린트 완료 실패" }, { status: 500 });
  }
}
