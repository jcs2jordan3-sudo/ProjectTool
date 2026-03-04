"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportUploader } from "./ImportUploader";
import { ImportPreview } from "./ImportPreview";
import { ImportResult } from "./ImportResult";
import { parseFile } from "@/lib/import/parseFile";
import { validateRows, type ParsedRow } from "@/lib/import/validateRows";

type ResultRow = { success: boolean; title: string; error?: string };

type Props = {
  projectId: string;
};

type Step = "upload" | "preview" | "result";

const TEMPLATE_CSV = `type,title,description,priority,status,assignee_email,due_date,parent_title,labels,sprint_name
EPIC,로그인 기능,,HIGH,,,,,인증,
STORY,OAuth 구현,,HIGH,,,,,인증,로그인 기능
TASK,구글 소셜 로그인,구글 OAuth 2.0 연동,HIGH,,,2026-04-01,OAuth 구현,,Sprint 1
TASK,GitHub 소셜 로그인,,MEDIUM,,,2026-04-07,OAuth 구현,,Sprint 1
STORY,이메일 인증,,MEDIUM,,,,로그인 기능,,
TASK,인증 메일 발송,,MEDIUM,,,2026-04-14,이메일 인증,,
`;

function downloadTemplate() {
  const blob = new Blob(["\uFEFF" + TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportClient({ projectId }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    failCount: number;
    results: ResultRow[];
  } | null>(null);

  async function handleFileSelected(file: File) {
    setFileName(file.name);
    const raw = await parseFile(file);
    const validated = validateRows(raw);
    setParsedRows(validated);
    setStep("preview");
  }

  async function handleImport() {
    const validRows = parsedRows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) return;

    setImporting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validRows.map((r) => ({
            type: r.type,
            title: r.title,
            description: r.description || undefined,
            priority: r.priority,
            status: r.status || undefined,
            assigneeEmail: r.assigneeEmail || undefined,
            dueDate: r.dueDate || undefined,
            parentTitle: r.parentTitle || undefined,
            labels: r.labels,
            sprintName: r.sprintName || undefined,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setImportResult(data);
        setStep("result");
      } else {
        const data = await res.json();
        alert(data.error ?? "Import에 실패했습니다.");
      }
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setStep("upload");
    setFileName("");
    setParsedRows([]);
    setImportResult(null);
  }

  const validCount = parsedRows.filter((r) => r.errors.length === 0).length;
  const errorCount = parsedRows.filter((r) => r.errors.length > 0).length;

  return (
    <div className="max-w-3xl space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">이슈 일괄 가져오기</h2>
          <p className="text-sm text-muted-foreground mt-1">
            CSV 또는 Excel 파일로 이슈를 한 번에 생성합니다. Epic → Story → Task 계층도 지원합니다.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="shrink-0 gap-1.5">
          <Download size={13} />
          템플릿 다운로드
        </Button>
      </div>

      {/* 컬럼 안내 */}
      {step === "upload" && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <p className="text-xs font-medium mb-2 text-muted-foreground">지원 컬럼</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
            {[
              ["type", "EPIC / STORY / TASK (기본: TASK)", true],
              ["title", "이슈 제목", true],
              ["description", "설명"],
              ["priority", "URGENT / HIGH / MEDIUM / LOW (기본: MEDIUM)"],
              ["status", "보드 상태 이름 (프로젝트 설정의 상태와 일치)"],
              ["assignee_email", "담당자 이메일 (프로젝트 멤버)"],
              ["due_date", "마감일 (YYYY-MM-DD)"],
              ["parent_title", "상위 이슈 제목 (같은 파일 내 참조 가능)"],
              ["labels", "레이블 (쉼표 구분, 예: 인증,백엔드)"],
              ["sprint_name", "스프린트 이름"],
            ].map(([col, desc, required]) => (
              <div key={String(col)} className="flex items-start gap-1.5">
                <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded shrink-0">
                  {col}
                </code>
                <span className="text-muted-foreground">
                  {required && <span className="text-red-500 mr-0.5">*</span>}
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step: Upload */}
      {step === "upload" && (
        <ImportUploader onParsed={handleFileSelected} />
      )}

      {/* Step: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{fileName}</span>
            <button onClick={handleReset} className="text-xs underline hover:text-foreground">
              다시 선택
            </button>
          </div>

          <ImportPreview rows={parsedRows} />

          <div className="flex items-center gap-3">
            <Button
              onClick={handleImport}
              disabled={importing || validCount === 0}
            >
              {importing
                ? "가져오는 중..."
                : errorCount > 0
                ? `${validCount}개 Import (${errorCount}개 건너뜀)`
                : `${validCount}개 Import`}
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              취소
            </Button>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && importResult && (
        <ImportResult
          successCount={importResult.successCount}
          failCount={importResult.failCount}
          results={importResult.results}
          projectId={projectId}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
