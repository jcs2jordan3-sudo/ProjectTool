import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경변수가 설정되지 않았습니다.");
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.");

/** 서버 전용 Supabase 클라이언트 (SERVICE_ROLE_KEY 사용 — 클라이언트에 절대 노출 금지) */
export const supabaseServer = createClient(supabaseUrl, serviceRoleKey);

export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "attachments";
