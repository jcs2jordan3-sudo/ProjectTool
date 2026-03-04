import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { IssuesPageClient } from "@/components/issues/IssuesPageClient";

type Props = { params: Promise<{ projectId: string }> };

export default async function IssuesPage({ params }: Props) {
  const { projectId } = await params;

  const [project, issues, members, boardStatuses] = await Promise.all([
    db.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } }),
    db.issue.findMany({
      where: { projectId, parentId: null },
      include: {
        assignee: { select: { id: true, name: true, color: true } },
        boardStatus: { select: { id: true, name: true, color: true } },
        children: {
          include: {
            assignee: { select: { id: true, name: true, color: true } },
            boardStatus: { select: { id: true, name: true, color: true } },
            children: {
              include: {
                assignee: { select: { id: true, name: true, color: true } },
                boardStatus: { select: { id: true, name: true, color: true } },
                disciplineWorks: { include: { discipline: true, assignee: { select: { id: true, name: true, color: true } } } },
              },
              orderBy: { order: "asc" },
            },
            disciplineWorks: { include: { discipline: true, assignee: { select: { id: true, name: true, color: true } } } },
          },
          orderBy: { order: "asc" },
        },
        disciplineWorks: {
          include: { discipline: { select: { id: true, name: true, color: true } }, assignee: { select: { id: true, name: true, color: true } } },
          orderBy: { order: "asc" },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    db.projectMember.findMany({
      where: { projectId },
      include: { member: { select: { id: true, name: true, color: true } } },
    }),
    db.boardStatus.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!project) notFound();

  return (
    <IssuesPageClient
      projectId={projectId}
      initialIssues={issues}
      members={members.map((pm) => pm.member)}
      boardStatuses={boardStatuses}
    />
  );
}
