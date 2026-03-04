import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectNav } from "@/components/projects/ProjectNav";

type Props = {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
};

export default async function ProjectLayout({ children, params }: Props) {
  const { projectId } = await params;
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  });
  if (!project) notFound();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ProjectNav project={project} />
      {children}
    </div>
  );
}
