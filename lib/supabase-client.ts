import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경변수가 설정되지 않았습니다.");
if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.");

/** 클라이언트용 Supabase 클라이언트 (ANON_KEY 사용 — 공개 가능) */
export const supabaseClient = createClient(supabaseUrl, anonKey);
