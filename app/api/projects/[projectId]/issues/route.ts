import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createIssueSchema } from "@/lib/validations/issue";
import { ZodError } from "zod";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? undefined;
    const sprintId = searchParams.get("sprintId") ?? undefined;
    const assigneeId = searchParams.get("assigneeId") ?? undefined;

    const issues = await db.issue.findMany({
      where: {
        projectId,
        ...(type === "notEpic"
          ? { type: { not: "EPIC" } }
          : type
          ? { type: type as "EPIC" | "STORY" | "TASK" }
          : {}),
        ...(sprintId === "none"
          ? { sprintId: null }
          : sprintId
          ? { sprintId }
          : {}),
        ...(assigneeId && { assigneeId }),
      },
      include: {
        assignee: { select: { id: true, name: true, color: true } },
        boardStatus: { select: { id: true, name: true, color: true } },
        children: { select: { id: true, title: true, type: true } },
        disciplineWorks: {
          include: {
            discipline: { select: { id: true, name: true, color: true } },
            assignee: { select: { id: true, name: true } },
          },
        },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(issues);
  } catch {
    return NextResponse.json({ error: "이슈 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const data = createIssueSchema.parse(body);

    // Epic은 sprint 없음, parent 없음
    if (data.type === "EPIC") {
      data.parentId = null;
      data.sprintId = null;
    }

    const issue = await db.issue.create({
      data: {
        projectId,
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        parentId: data.parentId ?? null,
        boardStatusId: data.boardStatusId ?? null,
        sprintId: data.sprintId ?? null,
        priority: data.priority,
        assigneeId: data.assigneeId ?? null,
        reporterName: data.reporterName ?? null,
        labels: data.labels,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        epicColor: data.epicColor ?? null,
        order: data.order,
      },
      include: {
        assignee: { select: { id: true, name: true, color: true } },
        boardStatus: { select: { id: true, name: true, color: true } },
      },
    });

    // TASK 이슈 생성 시 프로젝트의 모든 직군을 DisciplineWork로 자동 생성
    if (data.type === "TASK") {
      const disciplines = await db.discipline.findMany({
        where: { projectId },
        orderBy: { order: "asc" },
      });
      if (disciplines.length > 0) {
        await db.disciplineWork.createMany({
          data: disciplines.map((d, idx) => ({
            issueId: issue.id,
            disciplineId: d.id,
            status: "TODO",
            order: idx,
          })),
        });
      }
    }

    // disciplineWorks 포함하여 반환
    const issueWithWorks = await db.issue.findUnique({
      where: { id: issue.id },
      include: {
        assignee: { select: { id: true, name: true, color: true } },
        boardStatus: { select: { id: true, name: true, color: true } },
        disciplineWorks: {
          include: {
            discipline: { select: { id: true, name: true, color: true } },
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(issueWithWorks, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력 오류" }, { status: 400 });
    }
    return NextResponse.json({ error: "이슈 생성에 실패했습니다." }, { status: 500 });
  }
}
