"use client";

import dynamic from "next/dynamic";
import type { KanbanIssue } from "./KanbanCard";

type BoardStatus = { id: string; name: string; color: string; isFinal: boolean; order: number };
type Member = { id: string; name: string; color: string };

type Props = {
  projectId: string;
  statuses: BoardStatus[];
  initialIssues: KanbanIssue[];
  members: Member[];
  allStatuses: BoardStatus[];
};

// dnd-kit은 SSR에서 aria-describedby ID가 달라 hydration 오류 발생 → ssr: false
const KanbanBoard = dynamic(
  () => import("./KanbanBoard").then((m) => m.KanbanBoard),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">보드 로딩 중...</div> }
);

export function KanbanBoardWrapper(props: Props) {
  return <KanbanBoard {...props} />;
}
