# Webserive

> 경량 프로젝트 관리 툴 — 게임 개발사 내부용 Jira 대체

## 개요

50~100명 규모 게임 개발사 내부용 프로젝트 관리 툴.
MVP는 로그인 없이 누구나 접근 가능한 프로토타입.
Phase Auth에서 관리자 승인 기반 인증 추가 예정.

## 기술 스택

- **프레임워크**: Next.js 16 (App Router, TypeScript)
- **UI**: Tailwind CSS v4 + shadcn/ui
- **DB**: Supabase (PostgreSQL) + Prisma v7 ORM
- **서버 상태**: TanStack React Query v5
- **클라이언트 상태**: Zustand v5
- **드래그 앤 드롭**: dnd-kit
- **검증**: Zod v4
- **Excel 파싱**: SheetJS (xlsx)
- **알림**: Slack Incoming Webhook (MVP), Bot API (Phase Auth)
- **배포**: Vercel + Supabase 클라우드

## 빌드 & 실행

```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
npx prisma validate   # 스키마 검증
npx prisma generate   # Prisma 클라이언트 생성
npx prisma migrate dev --name <name>  # 마이그레이션 실행
```

## 환경변수

`.env` 파일 참고 — Supabase 연결 후 실제 값 입력 필요:
- `DATABASE_URL`: Supabase PostgreSQL 연결 문자열
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SLACK_WEBHOOK_URL`: Slack Incoming Webhook URL (선택)

## 디렉토리 구조

```
app/
  (app)/                  # 메인 앱 (사이드바 레이아웃)
    dashboard/            # 내 이슈 대시보드
    projects/             # 프로젝트 목록
      [projectId]/
        board/            # 칸반 보드
        backlog/          # 백로그 + 스프린트
        issues/           # 리스트 뷰
        import/           # CSV/Excel Import
        settings/
          board/          # 보드 상태 설정
          disciplines/    # 직군 설정
          members/        # 멤버 설정
    settings/
      members/            # 전체 팀원 관리 (MVP 인증 대체)
  api/                    # API Routes
  generated/prisma/       # Prisma 생성 클라이언트 (gitignored)
components/
  layout/                 # Sidebar, Header
  board/                  # 칸반 보드 컴포넌트
  issues/                 # 이슈 관련 컴포넌트
  disciplines/            # 직군 체크리스트
  sprint/                 # 스프린트 컴포넌트
  import/                 # CSV/Excel Import UI
  ui/                     # shadcn/ui 컴포넌트
lib/
  db.ts                   # Prisma 클라이언트 싱글톤
  utils.ts                # shadcn 유틸
  validations/            # Zod 스키마
  notifications.ts        # Slack Webhook 발송
  import/                 # CSV/Excel 파싱 유틸
prisma/
  schema.prisma           # DB 스키마
```

## 핵심 데이터 모델

- **Member**: 팀원 (MVP: 관리자 수동 등록, 로그인 없음)
- **Project**: 프로젝트
- **BoardStatus**: 프로젝트별 커스텀 칸반 컬럼 (is_final=true가 완료 상태)
- **Discipline**: 프로젝트별 직군 (기획/개발/아트/애니메이션 등)
- **Sprint**: 스프린트 (기간 자유 설정)
- **Issue**: 이슈 (EPIC > STORY > TASK 3단계 계층, self-referential parent_id)
- **DisciplineWork**: Task의 직군별 체크리스트 항목 (모두 DONE → Task 자동 완료)
- **ActivityLog**: 이슈 변경 이력 자동 기록

## 코딩 컨벤션

- 불변성 원칙: 객체 직접 수정 금지, spread operator 사용
- 파일 크기: 400줄 이하 권장, 800줄 절대 초과 금지
- Server/Client 컴포넌트 구분: DB 접근은 Server Component, 상호작용은 Client Component
- API Routes: `/app/api/` 하위, Zod로 입력 검증 필수
- 에러 처리: try/catch 필수, 사용자 친화적 메시지 반환

## 주요 커맨드

- `/plan [기능]` - 새 기능 구현 계획
- `/tdd [기능]` - TDD로 개발
- `/handoff-verify` - 빌드/테스트 자동 검증
- `/commit-push-pr` - 커밋 + PR 생성
