# Webserive - 경량 프로젝트 관리 툴 구현 계획

> Jira의 핵심 기능만 추려 빠르고 직관적인 사내 프로젝트 관리 도구

## 기술 스택

| 계층 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| DB/Auth | Supabase (Postgres + RLS) |
| ORM | Prisma |
| 서버 상태 | React Query (TanStack) |
| 클라이언트 상태 | Zustand |
| 드래그 앤 드롭 | dnd-kit |
| 검증 | Zod |
| 배포 | Vercel |

## Phase 1: 프로젝트 셋업
- [ ] Next.js 프로젝트 생성 (TypeScript, Tailwind, App Router)
- [ ] shadcn/ui 컴포넌트 설치
- [ ] Supabase 프로젝트 생성 및 환경변수 설정
- [ ] Prisma 스키마 작성 및 마이그레이션
- [ ] 기본 레이아웃 (사이드바, 헤더) 구현

## Phase 2: 인증
- [ ] Supabase Auth (이메일/구글 SSO)
- [ ] 로그인/회원가입 페이지
- [ ] 미들웨어로 인증 보호
- [ ] 프로필 설정 페이지

## Phase 3: 프로젝트 & 이슈 CRUD
- [ ] 프로젝트 생성/수정/삭제
- [ ] 멤버 초대 (이메일)
- [ ] 이슈 생성/수정/삭제 (type: EPIC / STORY / TASK)
- [ ] 이슈 상세 패널 — 부모 breadcrumb + 하위 이슈 목록
- [ ] Epic 색상 지정, Story→Epic 연결, Task→Story/Epic 연결
- [ ] 담당자, 우선순위, 레이블, 마감일 설정

## Phase 4: 칸반 보드
- [ ] dnd-kit으로 드래그 앤 드롭 칸반 구현
- [ ] 상태별 컬럼 (TODO / IN_PROGRESS / IN_REVIEW / DONE)
- [ ] 낙관적 업데이트
- [ ] 컬럼 내 이슈 순서 정렬

## Phase 5: 리스트 뷰 & 검색
- [ ] 계층 트리 리스트 뷰 (Epic → Story → Task 접기/펼치기)
- [ ] 플랫 테이블 뷰 전환 토글
- [ ] 필터 (담당자, 상태, 우선순위, 레이블, 타입)
- [ ] 정렬 (마감일, 생성일, 우선순위)
- [ ] 전체 텍스트 검색

## Phase 6: 댓글 & 알림
- [ ] 이슈 내 댓글 CRUD + @멘션
- [ ] Supabase Realtime 실시간 댓글
- [ ] 인앱 알림 (담당자 변경, 멘션)

## Phase 7: CSV/Excel Import
- [ ] SheetJS(xlsx)로 .csv / .xlsx 파싱
- [ ] Import UI: 파일 업로드 → 미리보기 → 컬럼 매핑 → 확인
- [ ] parent_title 참조로 계층 구조 자동 생성 (Epic → Story → Task 순)
- [ ] 유효성 검사 + 오류 행 표시
- [ ] Import 템플릿 CSV 다운로드 버튼

## Phase 8: 파일 첨부
- [ ] Supabase Storage 파일 업로드
- [ ] 이미지 미리보기
- [ ] 드래그 앤 드롭 업로드

## 의존성
- Phase 2는 Phase 1 완료 후 진행
- Phase 3~7은 Phase 2 완료 후 순차 진행

## 제외 기능 (의도적)
- 스프린트/번다운 차트
- 워크플로우 자동화
- 플러그인 생태계
- 타임 트래킹
- 포트폴리오 관리
