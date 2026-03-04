import { Header } from "@/components/layout/Header";
import { ProjectsClient } from "@/components/projects/ProjectsClient";
import { db } from "@/lib/db";

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: { include: { member: { select: { id: true, name: true, color: true } } } },
      _count: { select: { issues: true } },
    },
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="프로젝트" />
      <div className="flex-1 overflow-y-auto p-6">
        <ProjectsClient initialProjects={projects} />
      </div>
    </div>
  );
}
