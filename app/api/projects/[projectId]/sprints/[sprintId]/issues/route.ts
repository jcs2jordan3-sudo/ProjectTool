import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string; sprintId: string }> };

const schema = z.object({
  issueIds: z.array(z.string()),
});

// 이슈를 스프린트에 추가
export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId, sprintId } = await params;
    const body = await request.json();
    const { issueIds } = schema.parse(body);

    await db.issue.updateMany({
      where: { id: { in: issueIds }, projectId },
      data: { sprintId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력 오류" }, { status: 400 });
    }
    return NextResponse.json({ error: "이슈 추가 실패" }, { status: 500 });
  }
}

// 이슈를 스프린트에서 제거 (백로그로)
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { projectId, sprintId } = await params;
    const body = await request.json();
    const { issueIds } = schema.parse(body);

    await db.issue.updateMany({
      where: { id: { in: issueIds }, projectId, sprintId },
      data: { sprintId: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력 오류" }, { status: 400 });
    }
    return NextResponse.json({ error: "이슈 제거 실패" }, { status: 500 });
  }
}
