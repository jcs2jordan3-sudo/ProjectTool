import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { IssueDetailClient } from "@/components/issues/IssueDetailClient";

type Props = { params: Promise<{ projectId: string; issueId: string }> };

export default async function IssueDetailPage({ params }: Props) {
  const { projectId, issueId } = await params;

  const [issue, members, boardStatuses, disciplines] = await Promise.all([
    db.issue.findUnique({
      where: { id: issueId },
      include: {
        assignee: { select: { id: true, name: true, color: true } },
        boardStatus: true,
        parent: { select: { id: true, title: true, type: true, epicColor: true } },
        children: {
          include: {
            assignee: { select: { id: true, name: true, color: true } },
            boardStatus: { select: { id: true, name: true, color: true, isFinal: true } },
          },
          orderBy: { order: "asc" },
        },
        disciplineWorks: {
          include: {
            discipline: true,
            assignee: { select: { id: true, name: true, color: true } },
          },
          orderBy: { order: "asc" },
        },
        attachments: { orderBy: { createdAt: "desc" } },
        comments: { orderBy: { createdAt: "asc" } },
        activityLogs: {
          include: { member: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        sprint: { select: { id: true, name: true } },
      },
    }),
    db.projectMember.findMany({
      where: { projectId },
      include: { member: { select: { id: true, name: true, color: true } } },
    }),
    db.boardStatus.findMany({ where: { projectId }, orderBy: { order: "asc" } }),
    db.discipline.findMany({ where: { projectId }, orderBy: { order: "asc" } }),
  ]);

  if (!issue) notFound();

  return (
    <IssueDetailClient
      projectId={projectId}
      issue={issue}
      members={members.map((pm) => pm.member)}
      boardStatuses={boardStatuses}
      disciplines={disciplines}
    />
  );
}
