import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { DisciplineSettings } from "@/components/settings/DisciplineSettings";

type Props = { params: Promise<{ projectId: string }> };

export default async function DisciplinesSettingsPage({ params }: Props) {
  const { projectId } = await params;

  const [project, disciplines] = await Promise.all([
    db.project.findUnique({ where: { id: projectId }, select: { id: true } }),
    db.discipline.findMany({ where: { projectId }, orderBy: { order: "asc" } }),
  ]);

  if (!project) notFound();

  return (
    <div>
      <h3 className="text-base font-semibold mb-1">직군</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Task 이슈 상세의 직군 체크리스트에 나타날 직군을 관리합니다.
      </p>
      <DisciplineSettings projectId={projectId} initialDisciplines={disciplines} />
    </div>
  );
}
