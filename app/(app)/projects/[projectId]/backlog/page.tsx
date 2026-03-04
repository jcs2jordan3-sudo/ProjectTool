import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BacklogClient } from "@/components/sprint/BacklogClient";

type Props = { params: Promise<{ projectId: string }> };

export default async function BacklogPage({ params }: Props) {
  const { projectId } = await params;

  const [project, sprints, backlogIssues] = await Promise.all([
    db.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } }),
    db.sprint.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: {
        issues: {
          where: { type: { not: "EPIC" } },
          include: {
            assignee: { select: { id: true, name: true, color: true } },
            boardStatus: { select: { isFinal: true } },
          },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        },
      },
    }),
    db.issue.findMany({
      where: { projectId, sprintId: null, type: { not: "EPIC" } },
      include: {
        assignee: { select: { id: true, name: true, color: true } },
        boardStatus: { select: { isFinal: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  if (!project) notFound();

  return (
    <BacklogClient
      projectId={projectId}
      sprints={sprints}
      backlogIssues={backlogIssues}
    />
  );
}
