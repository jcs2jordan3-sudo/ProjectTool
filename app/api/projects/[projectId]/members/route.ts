import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string }> };

const addMemberSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(["OWNER", "MEMBER"]).default("MEMBER"),
});

export async function GET(_req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const members = await db.projectMember.findMany({
      where: { projectId },
      include: { member: true },
      orderBy: { joinedAt: "asc" },
    });
    return NextResponse.json(members);
  } catch {
    return NextResponse.json({ error: "멤버 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { memberId, role } = addMemberSchema.parse(body);

    const existing = await db.projectMember.findUnique({
      where: { projectId_memberId: { projectId, memberId } },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 프로젝트에 속한 멤버입니다." }, { status: 409 });
    }

    const pm = await db.projectMember.create({
      data: { projectId, memberId, role },
      include: { member: true },
    });
    return NextResponse.json(pm, { status: 201 });
  } catch {
    return NextResponse.json({ error: "멤버 추가에 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) return NextResponse.json({ error: "memberId가 필요합니다." }, { status: 400 });

    await db.projectMember.delete({
      where: { projectId_memberId: { projectId, memberId } },
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "멤버 제거에 실패했습니다." }, { status: 500 });
  }
}
