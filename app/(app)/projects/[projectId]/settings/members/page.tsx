import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProjectMemberSettings } from "@/components/settings/ProjectMemberSettings";

type Props = { params: Promise<{ projectId: string }> };

export default async function ProjectMembersSettingsPage({ params }: Props) {
  const { projectId } = await params;

  const [project, projectMembers, allMembers] = await Promise.all([
    db.project.findUnique({ where: { id: projectId }, select: { id: true } }),
    db.projectMember.findMany({
      where: { projectId },
      include: { member: { select: { id: true, name: true, email: true, color: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    db.member.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, color: true },
    }),
  ]);

  if (!project) notFound();

  return (
    <div>
      <h3 className="text-base font-semibold mb-1">프로젝트 멤버</h3>
      <p className="text-sm text-muted-foreground mb-6">
        이슈 담당자로 배정될 팀원을 프로젝트에 추가하세요.
      </p>
      <ProjectMemberSettings
        projectId={projectId}
        projectMembers={projectMembers}
        allMembers={allMembers}
      />
    </div>
  );
}
