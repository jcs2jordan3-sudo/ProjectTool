import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string }> };

// orderedIds: 해당 컬럼의 이슈 ID 순서 배열
// boardStatusId: 이동된 컬럼 (inter-column 이동 시)
const schema = z.object({
  issueId: z.string(),
  boardStatusId: z.string().nullable(),
  orderedIds: z.array(z.string()), // 목적지 컬럼의 새 순서
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { issueId, boardStatusId, orderedIds } = schema.parse(body);

    await db.$transaction([
      // 이슈 컬럼 이동
      db.issue.update({
        where: { id: issueId, projectId },
        data: { boardStatusId },
      }),
      // 목적지 컬럼 순서 일괄 업데이트
      ...orderedIds.map((id, index) =>
        db.issue.update({ where: { id }, data: { order: index } })
      ),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "순서 변경 실패" }, { status: 500 });
  }
}
