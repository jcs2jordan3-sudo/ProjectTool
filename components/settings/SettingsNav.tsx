"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = { projectId: string };

export function SettingsNav({ projectId }: Props) {
  const pathname = usePathname();
  const base = `/projects/${projectId}/settings`;

  const tabs = [
    { href: `${base}/board`, label: "보드 상태" },
    { href: `${base}/disciplines`, label: "직군" },
    { href: `${base}/members`, label: "멤버" },
    { href: `${base}/notifications`, label: "알림" },
  ];

  return (
    <div className="border-b px-6 py-3">
      <h2 className="text-sm font-semibold mb-3">프로젝트 설정</h2>
      <div className="flex gap-1">
        {tabs.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-3 py-1.5 text-xs rounded-md transition-colors",
              pathname === href
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
