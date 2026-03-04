import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { NotificationSettings } from "@/components/settings/NotificationSettings";

type Props = { params: Promise<{ projectId: string }> };

export default async function NotificationSettingsPage({ params }: Props) {
  const { projectId } = await params;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, slackWebhook: true },
  });

  if (!project) notFound();

  return (
    <div>
      <h3 className="text-base font-semibold mb-1">알림 설정</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Slack Webhook을 연결해 이슈 변경 사항을 팀 채널에 알림으로 받으세요.
      </p>
      <NotificationSettings projectId={projectId} initialWebhook={project.slackWebhook} />
    </div>
  );
}
