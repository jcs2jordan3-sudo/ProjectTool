import { z } from "zod";

export const IssueTypeEnum = z.enum(["EPIC", "STORY", "TASK"]);
export const PriorityEnum = z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]);

export const createIssueSchema = z.object({
  type: IssueTypeEnum,
  title: z.string().min(1, "제목을 입력하세요").max(200),
  description: z.string().max(5000).optional().nullable(),
  parentId: z.string().optional().nullable(),
  boardStatusId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  priority: PriorityEnum.default("MEDIUM"),
  assigneeId: z.string().optional().nullable(),
  reporterName: z.string().max(50).optional().nullable(),
  labels: z.array(z.string()).default([]),
  dueDate: z.string().optional().nullable(), // ISO string
  epicColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  order: z.number().int().default(0),
});

export const updateIssueSchema = createIssueSchema.partial();

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
