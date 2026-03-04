"use client";

import { cn } from "@/lib/utils";
import type { ParsedRow } from "@/lib/import/validateRows";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  rows: ParsedRow[];
};

const TYPE_STYLE: Record<string, string> = {
  EPIC: "bg-purple-100 text-purple-700",
  STORY: "bg-blue-100 text-blue-700",
  TASK: "bg-slate-100 text-slate-600",
};

const PRIORITY_STYLE: Record<string, string> = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-yellow-600",
  LOW: "text-slate-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: "긴급", HIGH: "높음", MEDIUM: "보통", LOW: "낮음",
};

export function ImportPreview({ rows }: Props) {
  const errorRows = rows.filter((r) => r.errors.length > 0);
  const validRows = rows.filter((r) => r.errors.length === 0);

  return (
    <div className="space-y-3">
      {/* 요약 */}
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle size={14} />
          {validRows.length}개 정상
        </span>
        {errorRows.length > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <AlertCircle size={14} />
            {errorRows.length}개 오류
          </span>
        )}
        <span className="text-muted-foreground">총 {rows.length}개 행</span>
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg overflow-auto max-h-96">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium w-10">#</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium w-16">타입</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">제목</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium w-14">우선순위</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium w-24">상위 이슈</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium w-24">담당자</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium w-20">마감일</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.rowIndex}
                className={cn(
                  "border-t",
                  row.errors.length > 0 ? "bg-red-50 dark:bg-red-950/20" : "hover:bg-muted/20"
                )}
              >
                <td className="px-3 py-1.5 text-muted-foreground">{row.rowIndex}</td>
                <td className="px-3 py-1.5">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", TYPE_STYLE[row.type])}>
                    {row.type}
                  </span>
                </td>
                <td className="px-3 py-1.5 max-w-48">
                  <span className="truncate block" title={row.title}>
                    {row.title || <span className="text-red-400 italic">제목 없음</span>}
                  </span>
                  {row.labels.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap">
                      {row.labels.map((l) => (
                        <Badge key={l} variant="secondary" className="text-[9px] py-0 px-1">{l}</Badge>
                      ))}
                    </div>
                  )}
                </td>
                <td className={cn("px-3 py-1.5 font-medium", PRIORITY_STYLE[row.priority])}>
                  {PRIORITY_LABELS[row.priority]}
                </td>
                <td className="px-3 py-1.5 text-muted-foreground truncate max-w-24" title={row.parentTitle}>
                  {row.parentTitle || "—"}
                </td>
                <td className="px-3 py-1.5 text-muted-foreground truncate" title={row.assigneeEmail}>
                  {row.assigneeEmail || "—"}
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  {row.dueDate || "—"}
                </td>
                <td className="px-3 py-1.5">
                  {row.errors.length > 0 && (
                    <div title={row.errors.join("\n")}>
                      <AlertCircle size={13} className="text-red-500 cursor-help" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 오류 목록 */}
      {errorRows.length > 0 && (
        <div className="border border-red-200 rounded-lg p-3 bg-red-50 dark:bg-red-950/10 space-y-1">
          <p className="text-xs font-medium text-red-600">오류 목록 (오류 행은 건너뛰고 나머지를 Import합니다)</p>
          {errorRows.map((row) => (
            <div key={row.rowIndex} className="text-xs text-red-500">
              <span className="font-medium">행 {row.rowIndex}</span>
              {row.title && <span className="text-muted-foreground"> ({row.title})</span>}
              : {row.errors.join(", ")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
