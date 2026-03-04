import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createProjectSchema } from "@/lib/validations/project";
import { ZodError } from "zod";

const DEFAULT_STATUSES = [
  { name: "할 일", color: "#6b7280", order: 0, isFinal: false },
  { name: "진행 중", color: "#3b82f6", order: 1, isFinal: false },
  { name: "검토 중", color: "#f59e0b", order: 2, isFinal: false },
  { name: "완료", color: "#22c55e", order: 3, isFinal: true },
];

const DEFAULT_DISCIPLINES = [
  { name: "기획", color: "#8b5cf6", order: 0 },
  { name: "개발", color: "#3b82f6", order: 1 },
  { name: "아트", color: "#ec4899", order: 2 },
  { name: "애니메이션", color: "#f97316", order: 3 },
];

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        members: { include: { member: true } },
        _count: { select: { issues: true } },
      },
    });
    return NextResponse.json(projects);
  } catch {
    return NextResponse.json({ error: "프로젝트 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createProjectSchema.parse(body);

    const project = await db.project.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        slackWebhook: data.slackWebhook || null,
        boardStatuses: { createMany: { data: DEFAULT_STATUSES } },
        disciplines: { createMany: { data: DEFAULT_DISCIPLINES } },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력 오류" }, { status: 400 });
    }
    return NextResponse.json({ error: "프로젝트 생성에 실패했습니다." }, { status: 500 });
  }
}
