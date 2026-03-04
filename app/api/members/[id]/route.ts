import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateMemberSchema } from "@/lib/validations/member";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateMemberSchema.parse(body);

    if (data.email) {
      const conflict = await db.member.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json({ error: "이미 등록된 이메일입니다." }, { status: 409 });
      }
    }

    const member = await db.member.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.color && { color: data.color }),
        ...(data.slackUserId !== undefined && { slackUserId: data.slackUserId }),
      },
    });
    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력 오류" }, { status: 400 });
    }
    return NextResponse.json({ error: "팀원 정보 수정에 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await db.member.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "팀원 삭제에 실패했습니다." }, { status: 500 });
  }
}
