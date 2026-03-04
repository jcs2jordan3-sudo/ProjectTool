# Webserive - 경량 프로젝트 관리 툴 구현 계획

> Jira의 핵심 기능만 추려 빠르고 직관적인 사내 프로젝트 관리 도구

## 기술 스택

| 계층 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| DB | Supabase (PostgreSQL) + Prisma v7 |
| 서버 상태 | TanStack React Query v5 |
| 클라이언트 상태 | Zustand v5 |
| 드래그 앤 드롭 | dnd-kit |
| 검증 | Zod v4 |
| Excel 파싱 | SheetJS (xlsx) |
| 배포 | Vercel + Supabase 클라우드 |

## Phase 1: 프로젝트 셋업 ✅
- [x] Next.js 프로젝트 생성 (TypeScript, Tailwind, App Router)
- [x] shadcn/ui 컴포넌트 설치
- [x] Supabase 프로젝트 생성 및 환경변수 설정
- [x] Prisma 스키마 작성 및 마이그레이션
- [x] 기본 레이아웃 (사이드바, 헤더) 구현

## Phase 1.5: 팀원 관리 (인증 대체) ✅
- [x] `/settings/members` 팀원 목록 페이지
- [x] 팀원 추가/수정/삭제 (이름, 이메일, 색상, slack_user_id)
- [x] 이슈 담당자 선택 시 팀원 목록 연동

## Phase 2: 인증 (Phase Auth로 이연)
- [ ] Supabase Auth (이메일/구글 SSO) — MVP 제외
- [ ] 관리자 승인 기반 회원가입 — 추후 구현

## Phase 3: 프로젝트 & 이슈 CRUD ✅
- [x] 프로젝트 생성/수정/삭제
- [x] 멤버 초대 (이메일)
- [x] 이슈 생성/수정/삭제 (type: EPIC / STORY / TASK)
- [x] 이슈 상세 패널 — 부모 breadcrumb + 하위 이슈 목록
- [x] Epic 색상 지정, Story→Epic 연결, Task→Story/Epic 연결
- [x] 담당자, 우선순위, 레이블, 마감일 설정
- [x] ActivityLog: 이슈 변경 이력 자동 기록

## Phase 3.5: 커스텀 보드 상태 & 직군 설정 ✅
- [x] 프로젝트 설정 > 보드 상태: 추가/수정/삭제/드래그 순서변경
- [x] is_final 토글 (완료 상태 지정)
- [x] 프로젝트 생성 시 기본 상태 4개 자동 생성
- [x] 프로젝트 설정 > 직군: 추가/색상/삭제 (기획/개발/아트/애니메이션)
- [x] Task 직군 체크리스트 (DisciplineWork): 모두 DONE → Task 자동 완료

## Phase 4: 칸반 보드 ✅
- [x] dnd-kit으로 드래그 앤 드롭 칸반 구현
- [x] 커스텀 상태 컬럼 (DB에서 BoardStatus 로드해 동적 렌더링)
- [x] 낙관적 업데이트
- [x] 칸반 카드에 직군 진행 배지 표시
- [x] KanbanBoardWrapper (dynamic import, ssr: false)로 하이드레이션 방지

## Phase 4.5: 스프린트 ✅
- [x] Sprint CRUD (이름, 목표, 시작일, 종료일)
- [x] 스프린트 시작/완료 액션
- [x] 이슈 백로그 ↔ 스프린트 이동
- [x] 스프린트 진행률 표시 (완료 이슈 / 전체 이슈)
- [x] BacklogClient UI (ACTIVE 우선 표시)

## Phase 5: 리스트 뷰 & 검색 ✅
- [x] 계층 트리 리스트 뷰 (Epic → Story → Task 접기/펼치기)
- [x] 플랫 테이블 뷰 전환 토글
- [x] 필터 (담당자, 상태, 우선순위, 타입)
- [x] 정렬 (마감일, 생성일, 우선순위) — 플랫 뷰 전용
- [x] 검색바 (제목 텍스트 검색)

## Phase 6: 댓글 & 슬랙 알림 ✅
- [x] 이슈 내 댓글 CRUD + @멘션
- [x] Slack Incoming Webhook 알림 (담당자 변경, 상태 변경, 댓글)
- [x] 프로젝트 설정 > 알림: Webhook URL 입력 + 테스트 발송
- [ ] Supabase Realtime 실시간 댓글 — 추후 구현

## Phase 7: CSV/Excel Import ✅
- [x] SheetJS(xlsx)로 .csv / .xlsx 파싱
- [x] ImportClient: 파일 업로드 → 미리보기 → 결과 (3단계)
- [x] parent_title 참조로 계층 구조 자동 생성 (Epic → Story → Task 순)
- [x] 유효성 검사 + 오류 행 표시 (빨간 하이라이트)
- [x] Import 템플릿 CSV 다운로드 버튼 (BOM 포함 한글 호환)

## Phase 8: 파일 첨부 ✅
- [x] Supabase Storage 파일 업로드 (최대 20MB)
- [x] 이미지 미리보기 + 파일 삭제
- [x] 드래그 앤 드롭 업로드
- [ ] Supabase Storage `attachments` 버킷 생성 필요 (수동, Public 버킷)

## Phase Auth: 추후 구현
- [ ] Supabase Auth 활성화 (이메일 로그인)
- [ ] 관리자 승인 기반 회원가입 (PENDING → ACTIVE)
- [ ] Slack Bot API 개인 DM 알림 전환
- [ ] 이메일 알림 (Resend)
