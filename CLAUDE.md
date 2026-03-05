# Webserive

> 경량 프로젝트 관리 툴 — 게임 개발사 내부용 Jira 대체

## 개요

50~100명 규모 게임 개발사 내부용. MVP는 인증 없이 누구나 접근 가능.
Phase Auth에서 관리자 승인 기반 인증 추가 예정.

## 기술 스택

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui
Prisma v7 · Supabase (PostgreSQL + Storage) · TanStack React Query v5
Zustand v5 · dnd-kit · Zod v4 · SheetJS · Slack Incoming Webhook

## 빌드 & 실행

```bash
npm run dev               # 개발 서버 (http://localhost:3000)
npm run build             # 프로덕션 빌드
npx prisma generate       # Prisma 클라이언트 생성 (app/generated/prisma/)
npx prisma migrate dev    # DB 마이그레이션
```

## 환경변수 (.env)

```
DATABASE_URL                  # Supabase PostgreSQL 연결 문자열
NEXT_PUBLIC_SUPABASE_URL      # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY     # Storage 서버사이드 업로드용
NEXT_PUBLIC_APP_URL           # Slack 알림 링크용 (예: https://yourapp.com)
```

## 핵심 디렉토리

```
app/(app)/projects/[projectId]/
  board/      # 칸반 보드
  backlog/    # 백로그 + 스프린트
  issues/     # 리스트 뷰
  import/     # CSV/Excel Import
  settings/   # 보드상태·직군·멤버·알림 설정
app/api/      # API Routes (Zod 입력 검증 필수)
components/   # board/ issues/ sprint/ import/ disciplines/ settings/ shared/
lib/          # db.ts · notifications.ts · import/ · validations/
prisma/       # schema.prisma · migrations/
```

## 핵심 규칙

- `ActivityAction` enum: `@/app/generated/prisma/client`에서 import
- `SelectItem value=""` 금지 → `"none"` 센티넬 사용
- KanbanBoard: `dynamic(..., { ssr: false })` 필수 (dnd-kit 하이드레이션)
- Server Component에서 DB 접근, Client Component에서 상호작용

# currentDate
Today's date is 2026-03-05.
