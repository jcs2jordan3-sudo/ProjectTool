import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BoardStatusSettings } from "@/components/settings/BoardStatusSettings";

type Props = { params: Promise<{ projectId: string }> };

export default async function BoardSettingsPage({ params }: Props) {
  const { projectId } = await params;

  const [project, statuses] = await Promise.all([
    db.project.findUnique({ where: { id: projectId }, select: { id: true } }),
    db.boardStatus.findMany({ where: { projectId }, orderBy: { order: "asc" } }),
  ]);

  if (!project) notFound();

  return (
    <div>
      <h3 className="text-base font-semibold mb-1">보드 상태</h3>
      <p className="text-sm text-muted-foreground mb-6">
        칸반 보드의 컬럼을 커스터마이징하세요. <span className="text-green-600 font-medium">완료</span> 상태는 직군 체크리스트 자동 완료에 사용됩니다.
      </p>
      <BoardStatusSettings projectId={projectId} initialStatuses={statuses} />
    </div>
  );
}
