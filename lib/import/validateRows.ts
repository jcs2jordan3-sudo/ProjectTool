import type { RawRow } from "./parseFile";

export type ValidIssueType = "EPIC" | "STORY" | "TASK";
export type ValidPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export type ParsedRow = {
  rowIndex: number;        // 원본 행 번호 (1-based)
  type: ValidIssueType;
  title: string;
  description: string;
  priority: ValidPriority;
  status: string;          // 상태 이름 (매핑은 서버에서)
  assigneeEmail: string;
  dueDate: string;         // YYYY-MM-DD or ""
  parentTitle: string;
  labels: string[];
  sprintName: string;
  errors: string[];        // 검증 오류 목록
};

const VALID_TYPES: ValidIssueType[] = ["EPIC", "STORY", "TASK"];
const VALID_PRIORITIES: ValidPriority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

export function validateRows(rows: RawRow[]): ParsedRow[] {
  return rows.map((row, i) => {
    const errors: string[] = [];
    const rowIndex = i + 2; // 헤더(1행) + 0-based → 1-based

    const rawType = (row["type"] ?? "").toString().trim().toUpperCase();
    const rawTitle = (row["title"] ?? "").toString().trim();
    const rawPriority = (row["priority"] ?? "MEDIUM").toString().trim().toUpperCase();
    const rawDueDate = (row["due_date"] ?? "").toString().trim();
    const rawLabels = (row["labels"] ?? "").toString().trim();

    // type
    let type: ValidIssueType = "TASK";
    if (!rawType) {
      type = "TASK";
    } else if (VALID_TYPES.includes(rawType as ValidIssueType)) {
      type = rawType as ValidIssueType;
    } else {
      errors.push(`type "${rawType}" 은 EPIC/STORY/TASK 중 하나여야 합니다`);
    }

    // title (필수)
    if (!rawTitle) errors.push("title은 필수입니다");

    // priority
    let priority: ValidPriority = "MEDIUM";
    if (rawPriority && VALID_PRIORITIES.includes(rawPriority as ValidPriority)) {
      priority = rawPriority as ValidPriority;
    } else if (rawPriority && rawPriority !== "MEDIUM") {
      errors.push(`priority "${rawPriority}" 은 URGENT/HIGH/MEDIUM/LOW 중 하나여야 합니다`);
    }

    // due_date
    let dueDate = "";
    if (rawDueDate) {
      const d = new Date(rawDueDate);
      if (isNaN(d.getTime())) {
        errors.push(`due_date "${rawDueDate}" 은 YYYY-MM-DD 형식이어야 합니다`);
      } else {
        dueDate = d.toISOString().split("T")[0];
      }
    }

    // labels (쉼표 구분)
    const labels = rawLabels
      ? rawLabels.split(",").map((l) => l.trim()).filter(Boolean)
      : [];

    return {
      rowIndex,
      type,
      title: rawTitle,
      description: (row["description"] ?? "").toString().trim(),
      priority,
      status: (row["status"] ?? "").toString().trim(),
      assigneeEmail: (row["assignee_email"] ?? "").toString().trim().toLowerCase(),
      dueDate,
      parentTitle: (row["parent_title"] ?? "").toString().trim(),
      labels,
      sprintName: (row["sprint_name"] ?? "").toString().trim(),
      errors,
    };
  });
}
