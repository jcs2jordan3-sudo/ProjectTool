"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
  mobileMenuButton?: React.ReactNode;
}

export function Header({ title, actions, mobileMenuButton }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        {mobileMenuButton}
        {title && (
          <h1 className="text-base font-semibold">{title}</h1>
        )}
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        {actions}
        <div className="relative hidden w-48 sm:block md:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="이슈 검색..."
            className="h-8 pl-8 text-sm"
          />
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
