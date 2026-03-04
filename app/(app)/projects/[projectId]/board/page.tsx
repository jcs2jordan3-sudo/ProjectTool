import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { KanbanBoardWrapper } from "@/components/board/KanbanBoardWrapper";

type Props = { params: Promise<{ projectId: string }> };

export default async function BoardPage({ params }: Props) {
  const { projectId } = await params;

  const [project, statuses, issues, members] = await Promise.all([
    db.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } }),
    db.boardStatus.findMany({ where: { projectId }, orderBy: { order: "asc" } }),
    db.issue.findMany({
      where: {
        projectId,
        type: { not: "EPIC" }, // 에픽은 보드에 표시 안 함
      },
      include: {
        assignee: { select: { id: true, name: true, color: true } },
        parent: { select: { id: true, title: true, epicColor: true } },
        disciplineWorks: {
          include: { discipline: { select: { id: true, name: true, color: true } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { comments: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    db.projectMember.findMany({
      where: { projectId },
      include: { member: { select: { id: true, name: true, color: true } } },
    }),
  ]);

  if (!project) notFound();

  if (statuses.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-6">
        먼저 설정 → 보드 상태에서 컬럼을 추가하세요.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden p-6">
      <KanbanBoardWrapper
        projectId={projectId}
        statuses={statuses}
        initialIssues={issues}
        members={members.map((pm) => pm.member)}
        allStatuses={statuses}
      />
    </div>
  );
}
