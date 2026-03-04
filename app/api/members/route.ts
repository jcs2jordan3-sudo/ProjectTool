import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createMemberSchema } from "@/lib/validations/member";
import { ZodError } from "zod";

export async function GET() {
  try {
    const members = await db.member.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(members);
  } catch {
    return NextResponse.json({ error: "팀원 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createMemberSchema.parse(body);

    const existing = await db.member.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "이미 등록된 이메일입니다." }, { status: 409 });
    }

    const member = await db.member.create({
      data: {
        name: data.name,
        email: data.email,
        color: data.color,
        slackUserId: data.slackUserId ?? null,
      },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력 오류" }, { status: 400 });
    }
    return NextResponse.json({ error: "팀원 등록에 실패했습니다." }, { status: 500 });
  }
}
