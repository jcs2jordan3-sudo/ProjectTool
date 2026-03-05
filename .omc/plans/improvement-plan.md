# React Query 도입 + 미사용 의존성 정리 계획서

## 1. 현재 데이터 페칭 패턴 분석

### 1.1 컴포넌트별 fetch 패턴 요약

| 컴포넌트 | fetch 횟수 | 패턴 | 데이터 갱신 방식 | 복잡도 |
|----------|-----------|------|----------------|--------|
| **BacklogClient** | 2 (sprints, backlog issues) | `useState + fetch + Promise.all` | `refresh()` = 수동 re-fetch 2개 API | **높음** |
| **IssueDetailClient** | 5+ (PATCH, POST, DELETE) | `useState + fetch + router.refresh()` | mutation마다 `router.refresh()` | **높음** |
| **KanbanBoard** | 2 (reorder POST) | `useState + fetch` | 낙관적 업데이트 + API POST, 추가 시 `window.location.reload()` | **높음** |
| **ProjectsClient** | 2 (GET list, DELETE) | `useState + fetch + router.refresh()` | `refresh()` = fetch + `router.refresh()` | **중간** |
| **MembersClient** | 2 (GET list, DELETE) | `useState + fetch + router.refresh()` | `refresh()` = fetch + `router.refresh()` | **중간** |
| **IssuesPageClient** | 1 (DELETE) | `useState + router.refresh()` | `router.refresh()` only | **중간** |
| **BoardStatusSettings** | 4 (POST, PATCH, DELETE, reorder) | `useState + fetch` (낙관적 업데이트) | setState로 즉시 반영 + API 호출 | **중간** |
| **DisciplineSettings** | 4 (POST, PATCH, DELETE, reorder) | `useState + fetch` (낙관적 업데이트) | setState로 즉시 반영 + API 호출 | **중간** |
| **ProjectMemberSettings** | 2 (POST, DELETE) | `useState + fetch + router.refresh()` | setState + `router.refresh()` | **낮음** |
| **NotificationSettings** | 2 (PATCH, 직접 POST) | `useState + fetch` | 로컬 상태만 변경 | **낮음** |
| **IssueFormDialog** | 1 (POST/PATCH) | `useState + fetch` | `onSuccess` 콜백 | **낮음** |
| **ProjectFormDialog** | 1 (POST/PATCH) | `useState + fetch` | `onSuccess` 콜백 | **낮음** |
| **SprintFormDialog** | 1 (POST/PATCH) | `useState + fetch` | `onSuccess` 콜백 | **낮음** |
| **MemberFormDialog** | 1 (POST/PATCH) | `useState + fetch` | `onSuccess` 콜백 | **낮음** |
| **AttachmentSection** | 2 (POST, DELETE) | `useState + fetch` | `onRefresh` 콜백 | **낮음** |
| **ImportClient** | 1 (POST) | `useState + fetch` | 로컬 상태 전환 | **낮음** |

### 1.2 공통 문제점

1. **이중 갱신**: `ProjectsClient`, `MembersClient`는 `fetch(GET)` + `router.refresh()` 이중 호출. Server Component의 초기 데이터와 클라이언트 상태가 분리됨.
2. **캐시 없음**: 같은 데이터(members, boardStatuses 등)를 여러 컴포넌트가 독립적으로 받음. 페이지 이동 시 항상 re-fetch.
3. **에러 핸들링 불균일**: 일부는 `res.ok` 체크, 일부는 무시. 네트워크 에러 catch 없음.
4. **로딩 상태 불균일**: mutation별 loading 관리가 제각각.
5. **`window.location.reload()`**: KanbanBoard에서 이슈 추가 시 전체 페이지 리로드.

### 1.3 Supabase 클라이언트 문제

`lib/supabase.ts`가 단일 파일로 서버/클라이언트 미분리:
- `SUPABASE_SERVICE_ROLE_KEY` (서버 전용)를 클라이언트에서도 접근 가능한 구조
- 현재는 Storage 업로드에만 사용 중이므로 서버 전용으로 분리 가능

### 1.4 미사용 의존성

- **zustand**: `package.json`에 설치됨, 프로젝트 전체에서 `import` 없음 -- **제거 대상**
- **@tanstack/react-query**: 설치됨, 프로젝트 전체에서 `import` 없음 -- **활성화 대상**

---

## 2. React Query 마이그레이션 우선순위

### Tier 1: 높은 효과 (데이터 fetch가 많고 복잡한 컴포넌트)

1. **BacklogClient** -- 2개 API를 동시 fetch + 다수 mutation
2. **IssueDetailClient** -- 5+ mutation, 모두 `router.refresh()` 의존
3. **KanbanBoard** -- 낙관적 업데이트 + `window.location.reload()` 제거 필요

### Tier 2: 중간 효과 (리스트 + CRUD)

4. **ProjectsClient** -- 이중 갱신 패턴 정리
5. **MembersClient** -- 이중 갱신 패턴 정리
6. **IssuesPageClient** -- 삭제 mutation 추가

### Tier 3: 낮은 효과 (Settings, 낙관적 업데이트 이미 구현)

7. **BoardStatusSettings** -- 이미 낙관적 업데이트, mutation만 래핑
8. **DisciplineSettings** -- 위와 동일
9. **ProjectMemberSettings** -- 단순 CRUD

### Tier 4: 최소 효과 (Form Dialog, 단발성 mutation)

10. **IssueFormDialog / ProjectFormDialog / SprintFormDialog / MemberFormDialog** -- `useMutation`으로 래핑하면 좋지만 우선순위 낮음
11. **NotificationSettings** -- 설정 저장만
12. **AttachmentSection / ImportClient** -- 파일 업로드 특수 케이스

---

## 3. 구현 계획

### Phase 0: 인프라 설정 (새 파일 생성)

#### 새 파일 목록

| 파일 경로 | 역할 |
|----------|------|
| `lib/query-client.ts` | QueryClient 생성 + 기본 옵션 설정 |
| `components/providers/QueryProvider.tsx` | `QueryClientProvider` 래퍼 (use client) |
| `lib/api.ts` | 공통 fetch 래퍼 (에러 핸들링 표준화) |
| `lib/hooks/use-projects.ts` | 프로젝트 관련 query/mutation hooks |
| `lib/hooks/use-members.ts` | 멤버 관련 query/mutation hooks |
| `lib/hooks/use-issues.ts` | 이슈 관련 query/mutation hooks |
| `lib/hooks/use-sprints.ts` | 스프린트 관련 query/mutation hooks |
| `lib/hooks/use-board-statuses.ts` | 보드 상태 query/mutation hooks |
| `lib/hooks/use-disciplines.ts` | 직군 query/mutation hooks |

#### 수정 파일

| 파일 경로 | 변경 내용 |
|----------|----------|
| `app/layout.tsx` | `QueryProvider` 추가 |
| `package.json` | `zustand` 제거 |
| `lib/supabase.ts` | 서버 전용으로 변경, 파일명을 `lib/supabase-server.ts`로 |

#### 작업 내용

1. **QueryClient 설정** (`lib/query-client.ts`):
   ```typescript
   import { QueryClient } from "@tanstack/react-query";

   export function makeQueryClient() {
     return new QueryClient({
       defaultOptions: {
         queries: {
           staleTime: 30 * 1000,       // 30초
           refetchOnWindowFocus: false,
         },
       },
     });
   }
   ```

2. **QueryProvider** (`components/providers/QueryProvider.tsx`):
   ```typescript
   "use client";
   import { QueryClientProvider } from "@tanstack/react-query";
   import { makeQueryClient } from "@/lib/query-client";
   import { useState } from "react";

   export function QueryProvider({ children }: { children: React.ReactNode }) {
     const [client] = useState(makeQueryClient);
     return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
   }
   ```

3. **공통 API 래퍼** (`lib/api.ts`):
   ```typescript
   export class ApiError extends Error {
     constructor(public status: number, message: string) {
       super(message);
     }
   }

   export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
     const res = await fetch(url, {
       ...init,
       headers: { "Content-Type": "application/json", ...init?.headers },
     });
     if (!res.ok) {
       const data = await res.json().catch(() => ({}));
       throw new ApiError(res.status, data.error ?? "요청에 실패했습니다.");
     }
     return res.json();
   }
   ```

4. **Zustand 제거**: `npm uninstall zustand`

5. **Supabase 분리**: `lib/supabase.ts` -> `lib/supabase-server.ts` (서버 전용)

---

### Phase 1: Tier 1 마이그레이션

#### 1-A. BacklogClient 마이그레이션

**현재**: `useState` + `refresh()` 내부에서 2개 API 동시 fetch
**변경**:
- `useQuery("sprints", projectId)` + `useQuery("backlogIssues", projectId)`
- `useMutation` for moveToSprint, removeFromSprint, start, complete, delete
- mutation 성공 시 `queryClient.invalidateQueries(["sprints"])` + `["backlogIssues"]`

**수정 파일**: `components/sprint/BacklogClient.tsx`
**새 파일**: `lib/hooks/use-sprints.ts`

**핵심 변경**:
```typescript
// Before
const refresh = useCallback(async () => {
  const [sprintsRes, backlogRes] = await Promise.all([...]);
  if (sprintsRes.ok) setSprints(await sprintsRes.json());
  if (backlogRes.ok) setBacklogIssues(await backlogRes.json());
}, [projectId]);

// After
const { data: sprints } = useQuery({
  queryKey: ["projects", projectId, "sprints"],
  queryFn: () => apiFetch(`/api/projects/${projectId}/sprints`),
  initialData: initialSprints,
});
const { data: backlogIssues } = useQuery({
  queryKey: ["projects", projectId, "backlogIssues"],
  queryFn: () => apiFetch(`/api/projects/${projectId}/issues?sprintId=none&type=notEpic`),
  initialData: initialBacklog,
});
```

- `initialData`로 SSR 데이터 유지 (SEO/초기 렌더)
- `useState` 2개 + `refresh` 함수 제거
- SprintSection 내부 mutation들도 `useMutation` + `invalidateQueries`로 교체

#### 1-B. IssueDetailClient 마이그레이션

**현재**: 5+ 개별 fetch + 모두 `router.refresh()`
**변경**:
- 이슈 데이터는 Server Component에서 전달받으므로 query 불필요
- `updateIssue`, `addDisciplineWork`, `updateDisciplineWork`, `deleteDisciplineWork`, `submitComment` -> 각각 `useMutation`
- mutation 성공 시 `queryClient.invalidateQueries(["projects", projectId, "issues"])`
- `router.refresh()` 제거 -> invalidation 기반

**수정 파일**: `components/issues/IssueDetailClient.tsx`
**새 파일**: `lib/hooks/use-issues.ts`

#### 1-C. KanbanBoard 마이그레이션

**현재**: `window.location.reload()` for 이슈 추가, `fetch` for reorder
**변경**:
- reorder -> `useMutation` (낙관적 업데이트 유지)
- `handleIssueAdded` -> `queryClient.invalidateQueries(["projects", projectId, "kanbanIssues"])` (전체 리로드 제거)
- KanbanBoard 자체를 query 기반으로 전환하려면 wrapper(KanbanBoardWrapper)도 수정 필요

**수정 파일**: `components/board/KanbanBoard.tsx`, `components/board/KanbanBoardWrapper.tsx`

---

### Phase 2: Tier 2 마이그레이션

#### 2-A. ProjectsClient

**현재**: `useState(initialProjects)` + `refresh()` = fetch GET + `router.refresh()`
**변경**:
- `useQuery(["projects"], () => apiFetch("/api/projects"), { initialData })`
- delete -> `useMutation` + `invalidateQueries(["projects"])`
- `refresh` 함수 + `useState` 제거

**수정 파일**: `components/projects/ProjectsClient.tsx`
**새 파일**: `lib/hooks/use-projects.ts`

#### 2-B. MembersClient

**현재**: 동일 이중 갱신 패턴
**변경**: ProjectsClient와 동일 패턴
- `useQuery(["members"])` + delete `useMutation`

**수정 파일**: `components/members/MembersClient.tsx`
**새 파일**: `lib/hooks/use-members.ts`

#### 2-C. IssuesPageClient

**현재**: `useState(initialIssues)` + `router.refresh()`
**변경**:
- issues는 Server Component 전달이므로 query 전환 선택적
- FlatRow 내 delete -> `useMutation` + `invalidateQueries`

**수정 파일**: `components/issues/IssuesPageClient.tsx`

---

### Phase 3: Tier 3 마이그레이션

Settings 컴포넌트들은 이미 낙관적 업데이트가 구현되어 있어 `useMutation` 래핑만 진행.

- `BoardStatusSettings`: CRUD mutation 4개 -> `useMutation`
- `DisciplineSettings`: CRUD mutation 4개 -> `useMutation`
- `ProjectMemberSettings`: add/remove -> `useMutation`

**수정 파일**: `components/settings/BoardStatusSettings.tsx`, `DisciplineSettings.tsx`, `ProjectMemberSettings.tsx`
**새 파일**: `lib/hooks/use-board-statuses.ts`, `lib/hooks/use-disciplines.ts`

---

### Phase 4: Tier 4 (선택적)

Form Dialog들은 단발성 mutation이므로 기존 패턴 유지 가능.
시간이 허용되면 `useMutation` 래핑.

---

## 4. 마이그레이션 순서 (실행 순서)

```
Phase 0: 인프라 설정
  0-1. QueryClient + QueryProvider 생성 + layout.tsx에 추가
  0-2. 공통 API 래퍼 (lib/api.ts) 생성
  0-3. Zustand 제거 (npm uninstall zustand)
  0-4. Supabase 클라이언트 서버 전용 분리

Phase 1: Tier 1 (높은 효과)
  1-1. lib/hooks/use-sprints.ts + BacklogClient 마이그레이션
  1-2. lib/hooks/use-issues.ts + IssueDetailClient 마이그레이션
  1-3. KanbanBoard 마이그레이션 (window.location.reload 제거)

Phase 2: Tier 2 (중간 효과)
  2-1. lib/hooks/use-projects.ts + ProjectsClient 마이그레이션
  2-2. lib/hooks/use-members.ts + MembersClient 마이그레이션
  2-3. IssuesPageClient 마이그레이션

Phase 3: Tier 3 (Settings)
  3-1. BoardStatusSettings + DisciplineSettings mutation 래핑
  3-2. ProjectMemberSettings mutation 래핑
```

## 5. Query Key 설계

```typescript
// 프로젝트
["projects"]                                          // 프로젝트 목록
["projects", projectId]                               // 프로젝트 상세

// 이슈
["projects", projectId, "issues"]                     // 이슈 트리
["projects", projectId, "issues", issueId]            // 이슈 상세
["projects", projectId, "kanbanIssues"]               // 칸반 보드 이슈

// 스프린트
["projects", projectId, "sprints"]                    // 스프린트 목록
["projects", projectId, "backlogIssues"]              // 백로그 이슈

// 설정
["projects", projectId, "boardStatuses"]              // 보드 상태
["projects", projectId, "disciplines"]                // 직군
["projects", projectId, "members"]                    // 프로젝트 멤버

// 전역
["members"]                                           // 전체 팀원
```

## 6. 위험 요소 및 대응

| 위험 | 대응 |
|------|------|
| Server Component 초기 데이터와 query 데이터 충돌 | `initialData` 옵션 사용 + `staleTime: 30s` |
| KanbanBoard의 낙관적 업데이트가 복잡 | `useMutation.onMutate`에서 기존 낙관적 로직 유지 |
| Settings 컴포넌트의 낙관적 업데이트 패턴 | 기존 `setState` 기반 낙관적 업데이트를 `onMutate`로 이전 |
| `router.refresh()` 제거 시 Server Component 데이터 미갱신 | query 기반으로 전환된 컴포넌트는 `invalidateQueries` 사용 |

## 7. 완료 조건

- [ ] 모든 컴포넌트에서 수동 `fetch + setState` 패턴 제거
- [ ] `window.location.reload()` 제거
- [ ] `router.refresh()` 최소화 (query 기반 갱신으로 대체)
- [ ] Zustand 의존성 제거됨
- [ ] Supabase 클라이언트 서버/클라이언트 분리됨
- [ ] 공통 API 에러 핸들링 (`ApiError`) 적용됨
- [ ] 빌드 성공 (0 errors)
