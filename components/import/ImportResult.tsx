"use client";

import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ResultRow = { success: boolean; title: string; error?: string };

type Props = {
  successCount: number;
  failCount: number;
  results: ResultRow[];
  projectId: string;
  onReset: () => void;
};

export function ImportResult({ successCount, failCount, results, projectId, onReset }: Props) {
  const total = successCount + failCount;

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className={cn(
        "border rounded-xl p-6 flex items-center gap-6",
        failCount === 0 ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"
      )}>
        {failCount === 0 ? (
          <CheckCircle size={40} className="text-green-500 shrink-0" />
        ) : (
          <div className="relative shrink-0">
            <CheckCircle size={40} className="text-green-500" />
          </div>
        )}
        <div>
          <p className="text-lg font-semibold">
            {total}개 중 {successCount}개 Import 완료
          </p>
          {failCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {failCount}개 실패 — 아래 목록에서 확인하세요
            </p>
          )}
        </div>
      </div>

      {/* 상세 결과 */}
      {failCount > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground border-b">
            실패한 항목
          </div>
          <div className="divide-y max-h-48 overflow-y-auto">
            {results.filter((r) => !r.success).map((r, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2">
                <XCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium">{r.title}</span>
                  {r.error && (
                    <p className="text-xs text-muted-foreground">{r.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button onClick={onReset} variant="outline">
          다시 Import
        </Button>
        <Button asChild>
          <a href={`/projects/${projectId}/issues`}>
            이슈 목록으로 이동
            <ArrowRight size={14} className="ml-1.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}
