import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateProjectSchema } from "@/lib/validations/project";
import { ZodError } from "zod";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        members: { include: { member: true } },
        boardStatuses: { orderBy: { order: "asc" } },
        disciplines: { orderBy: { order: "asc" } },
        sprints: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!project) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "프로젝트를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const data = updateProjectSchema.parse(body);

    const project = await db.project.update({
      where: { id: projectId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.slackWebhook !== undefined && { slackWebhook: data.slackWebhook || null }),
      },
    });
    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력 오류" }, { status: 400 });
    }
    return NextResponse.json({ error: "프로젝트 수정에 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    await db.project.delete({ where: { id: projectId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "프로젝트 삭제에 실패했습니다." }, { status: 500 });
  }
}
