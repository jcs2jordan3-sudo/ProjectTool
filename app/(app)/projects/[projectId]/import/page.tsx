import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ImportClient } from "@/components/import/ImportClient";

type Props = { params: Promise<{ projectId: string }> };

export default async function ImportPage({ params }: Props) {
  const { projectId } = await params;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  });

  if (!project) notFound();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <ImportClient projectId={projectId} />
    </div>
  );
}
