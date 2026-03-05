import { Header } from "@/components/layout/Header";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const [projects, recentActivities, activeSprints] = await Promise.all([
    fetchProjects(),
    fetchRecentActivities(),
    fetchActiveSprints(),
  ]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="대시보드" />
      <div className="flex-1 overflow-y-auto">
        <DashboardClient
          projects={projects}
          recentActivities={recentActivities}
          activeSprints={activeSprints}
        />
      </div>
    </div>
  );
}

async function fetchProjects() {
  const rows = await db.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: { issues: true, members: true },
      },
    },
  });

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    issueCount: p._count.issues,
    memberCount: p._count.members,
  }));
}

async function fetchRecentActivities() {
  return db.activityLog.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      actionType: true,
      createdAt: true,
      issue: {
        select: {
          title: true,
          project: { select: { name: true } },
        },
      },
      member: { select: { name: true } },
    },
  });
}

async function fetchActiveSprints() {
  const sprints = await db.sprint.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      project: { select: { name: true } },
      issues: {
        select: {
          boardStatusId: true,
          boardStatus: { select: { isFinal: true } },
        },
      },
    },
  });

  return sprints.map((sprint) => {
    const totalIssues = sprint.issues.length;
    const completedIssues = sprint.issues.filter(
      (i) => i.boardStatus?.isFinal === true
    ).length;
    return {
      id: sprint.id,
      name: sprint.name,
      projectName: sprint.project.name,
      totalIssues,
      completedIssues,
    };
  });
}
