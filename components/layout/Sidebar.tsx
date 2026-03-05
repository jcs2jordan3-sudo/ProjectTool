"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const topNavItems: NavItem[] = [
  {
    label: "대시보드",
    href: "/dashboard",
    icon: <LayoutDashboard size={16} />,
  },
  {
    label: "프로젝트",
    href: "/projects",
    icon: <FolderKanban size={16} />,
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: "설정",
    href: "/settings/members",
    icon: <Settings size={16} />,
    children: [
      { label: "팀원 관리", href: "/settings/members" },
    ],
  },
];

function NavLink({
  item,
  depth = 0,
  onNavigate,
}: {
  item: NavItem;
  depth?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm transition-colors",
                  pathname === child.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {/* 로고 */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/projects" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            W
          </div>
          <span className="font-semibold text-sm">Webserive</span>
        </Link>
      </div>

      {/* 상단 네비게이션 */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {topNavItems.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* 하단 네비게이션 */}
      <div className="space-y-1 border-t p-2">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </>
  );
}

export function MobileMenuButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label="메뉴 열기"
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
    >
      <Menu size={18} />
    </button>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex h-full w-56 flex-col border-r bg-background">
        <SidebarContent />
      </aside>

      {/* 모바일 햄버거 버튼 — Header에서 렌더링하도록 export */}
      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 모바일 드로어 */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-background transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="메뉴 닫기"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <X size={18} />
        </button>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* 모바일 토글 버튼 — 레이아웃에서 포지셔닝 */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="메뉴 열기"
        className="fixed bottom-4 left-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md md:hidden"
      >
        <Menu size={18} />
      </button>
    </>
  );
}
