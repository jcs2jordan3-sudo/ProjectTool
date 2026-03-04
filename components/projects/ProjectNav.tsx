"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Kanban, List, Archive, Settings, Upload } from "lucide-react";

type Props = {
  project: { id: string; name: string };
};

export function ProjectNav({ project }: Props) {
  const pathname = usePathname();
  const base = `/projects/${project.id}`;

  const tabs = [
    { href: `${base}/board`, label: "보드", icon: Kanban },
    { href: `${base}/issues`, label: "이슈", icon: List },
    { href: `${base}/backlog`, label: "백로그", icon: Archive },
    { href: `${base}/import`, label: "가져오기", icon: Upload },
    { href: `${base}/settings/board`, label: "설정", icon: Settings },
  ];

  return (
    <div className="border-b bg-background px-6">
      <div className="flex items-center gap-1 py-2">
        <span className="text-sm font-semibold mr-4 text-foreground">{project.name}</span>
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
              pathname.startsWith(href)
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
