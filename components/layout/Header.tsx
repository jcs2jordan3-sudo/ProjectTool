"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      {title && (
        <h1 className="text-base font-semibold">{title}</h1>
      )}
      <div className="flex flex-1 items-center justify-end gap-3">
        {actions}
        <div className="relative w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="이슈 검색..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>
    </header>
  );
}
