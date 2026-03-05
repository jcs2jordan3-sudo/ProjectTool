"use client";

import { ActivityAction } from "@/app/generated/prisma/client";
import { FolderKanban, Users, Activity, Zap } from "lucide-react";

interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  issueCount: number;
  memberCount: number;
}

interface ActivityItem {
  id: string;
  actionType: ActivityAction;
  createdAt: Date;
  issue: { title: string; project: { name: string } };
  member: { name: string } | null;
}

interface SprintSummary {
  id: string;
  name: string;
  projectName: string;
  totalIssues: number;
  completedIssues: number;
}

interface DashboardClientProps {
  projects: ProjectSummary[];
  recentActivities: ActivityItem[];
  activeSprints: SprintSummary[];
}

const ACTION_LABELS: Record<ActivityAction, string> = {
  STATUS_CHANGED: "상태 변경",
  ASSIGNEE_CHANGED: "담당자 변경",
  DISCIPLINE_UPDATED: "직군 업데이트",
  TITLE_CHANGED: "제목 변경",
  SPRINT_ASSIGNED: "스프린트 배정",
  COMMENT_ADDED: "댓글 추가",
  PRIORITY_CHANGED: "우선순위 변경",
  DUE_DATE_CHANGED: "마감일 변경",
  LABEL_CHANGED: "레이블 변경",
  AUTO_COMPLETED: "자동 완료",
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}일 전`;
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function DashboardClient({
  projects,
  recentActivities,
  activeSprints,
}: DashboardClientProps) {
  const totalIssues = projects.reduce((sum, p) => sum + p.issueCount, 0);
  const totalMembers = projects.reduce((sum, p) => sum + p.memberCount, 0);

  return (
    <div className="space-y-6 p-6">
      {/* 통계 요약 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<FolderKanban size={18} />} label="전체 프로젝트" value={projects.length} />
        <StatCard icon={<Activity size={18} />} label="전체 이슈" value={totalIssues} />
        <StatCard icon={<Users size={18} />} label="전체 멤버" value={totalMembers} />
        <StatCard icon={<Zap size={18} />} label="활성 스프린트" value={activeSprints.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 프로젝트 목록 */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            프로젝트
          </h2>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">프로젝트가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{project.name}</p>
                    {project.description && (
                      <p className="truncate text-xs text-muted-foreground">{project.description}</p>
                    )}
                  </div>
                  <div className="ml-4 flex shrink-0 gap-3 text-xs text-muted-foreground">
                    <span>{project.issueCount} 이슈</span>
                    <span>{project.memberCount} 멤버</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 활성 스프린트 진행률 */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            활성 스프린트
          </h2>
          {activeSprints.length === 0 ? (
            <p className="text-sm text-muted-foreground">진행 중인 스프린트가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {activeSprints.map((sprint) => {
                const pct = sprint.totalIssues === 0
                  ? 0
                  : Math.round((sprint.completedIssues / sprint.totalIssues) * 100);
                return (
                  <div key={sprint.id} className="rounded-lg border bg-card px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{sprint.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{sprint.projectName}</p>
                      </div>
                      <span className="ml-3 shrink-0 text-sm font-semibold text-primary">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {sprint.completedIssues} / {sprint.totalIssues} 완료
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* 최근 활동 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          최근 활동
        </h2>
        {recentActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground">최근 활동이 없습니다.</p>
        ) : (
          <div className="divide-y rounded-lg border bg-card">
            {recentActivities.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {log.member?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium">{log.member?.name ?? "시스템"}</span>
                    {" — "}
                    <span className="text-muted-foreground">{ACTION_LABELS[log.actionType]}</span>
                    {" · "}
                    <span className="text-muted-foreground">{log.issue.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.issue.project.name} · {formatRelativeTime(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
