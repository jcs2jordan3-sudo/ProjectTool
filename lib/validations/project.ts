import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "프로젝트 이름을 입력하세요").max(100),
  description: z.string().max(500).optional().nullable(),
  slackWebhook: z.string().url("올바른 URL이 아닙니다").optional().nullable().or(z.literal("")),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
