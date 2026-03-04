import { z } from "zod";

export const createMemberSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요").max(50),
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "올바른 색상 코드가 아닙니다")
    .default("#6366f1"),
  slackUserId: z.string().max(20).optional().nullable(),
});

export const updateMemberSchema = createMemberSchema.partial();

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
