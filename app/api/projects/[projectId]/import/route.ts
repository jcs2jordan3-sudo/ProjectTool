import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ projectId: string }> };

const rowSchema = z.object({
  type: z.enum(["EPIC", "STORY", "TASK"]),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  status: z.string().optional(),
  assigneeEmail: z.string().optional(),
  dueDate: z.string().optional(),
  parentTitle: z.string().optional(),
  labels: z.array(z.string()).default([]),
  sprintName: z.string().optional(),
});

const bodySchema = z.object({
  rows: z.array(rowSchema),
});

type RowInput = z.infer<typeof rowSchema>;

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { rows } = bodySchema.parse(body);

    if (rows.length === 0) {
      return NextResponse.json({ error: "가져올 행이 없습니다." }, { status: 400 });
    }

    // 프로젝트 조회: 보드 상태, 스프린트, 멤버 미리 로드
    const [boardStatuses, sprints, members] = await Promise.all([
      db.boardStatus.findMany({ where: { projectId } }),
      db.sprint.findMany({ where: { projectId } }),
      db.member.findMany({ where: { projectMembers: { some: { projectId } } } }),
    ]);

    const statusMap = new Map(boardStatuses.map((s) => [s.name.toLowerCase(), s.id]));
    const sprintMap = new Map(sprints.map((s) => [s.name.toLowerCase(), s.id]));
    const memberMap = new Map(members.map((m) => [m.email.toLowerCase(), m.id]));

    const results: { success: boolean; title: string; error?: string }[] = [];
    const createdByTitle = new Map<string, string>(); // title → id (같은 Import 내 참조용)

    // EPIC → STORY → TASK 순으로 정렬
    const order: Record<string, number> = { EPIC: 0, STORY: 1, TASK: 2 };
    const sorted = [...rows].sort((a, b) => (order[a.type] ?? 2) - (order[b.type] ?? 2));

    for (const row of sorted) {
      try {
        const boardStatusId = row.status
          ? (statusMap.get(row.status.toLowerCase()) ?? null)
          : null;
        const sprintId = row.sprintName
          ? (sprintMap.get(row.sprintName.toLowerCase()) ?? null)
          : null;
        const assigneeId = row.assigneeEmail
          ? (memberMap.get(row.assigneeEmail.toLowerCase()) ?? null)
          : null;

        // 부모 이슈: 같은 Import 내에서 먼저 생성된 것 또는 기존 DB 이슈
        let parentId: string | null = null;
        if (row.parentTitle && row.type !== "EPIC") {
          // 1. 이번 Import에서 생성한 것 먼저
          parentId = createdByTitle.get(row.parentTitle) ?? null;
          // 2. DB에서 검색
          if (!parentId) {
            const existing = await db.issue.findFirst({
              where: { projectId, title: row.parentTitle },
              select: { id: true },
            });
            parentId = existing?.id ?? null;
          }
        }

        const issue = await db.issue.create({
          data: {
            projectId,
            type: row.type,
            title: row.title,
            description: row.description || null,
            priority: row.priority,
            boardStatusId,
            sprintId: row.type !== "EPIC" ? sprintId : null,
            assigneeId,
            parentId,
            dueDate: row.dueDate ? new Date(row.dueDate) : null,
            labels: row.labels,
          },
        });

        createdByTitle.set(row.title, issue.id);
        results.push({ success: true, title: row.title });
      } catch (err) {
        console.error(`Import row error [${row.title}]:`, err);
        results.push({
          success: false,
          title: row.title,
          error: "이슈 생성에 실패했습니다.",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({ results, successCount, failCount });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "입력 오류" }, { status: 400 });
    }
    return NextResponse.json({ error: "Import 실패" }, { status: 500 });
  }
}
