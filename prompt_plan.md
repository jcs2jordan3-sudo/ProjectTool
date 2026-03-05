# 구현 계획: UI 버그 수정 + 최적화 + 보드 필터 (5건) — ✅ 완료

## 요구사항 정리

1. ~~**이슈 생성 시 상위 작업 선택 불가**~~ ✅
2. ~~**사이드바 X/전체보기 겹침**~~ ✅
3. ~~**이슈 목록 칼럼 정렬 안 맞음**~~ ✅
4. ~~**전체 UI 최적화**~~ ✅
5. ~~**보드 필터 기능**~~ ✅

---

## Phase 1: 이슈 생성 시 상위 작업 선택 가능하도록 수정

### 원인
- `KanbanBoard.tsx`의 Column 컴포넌트가 `IssueFormDialog`에 `parentOptions={[]}`을 전달
- 보드 페이지(`board/page.tsx`)에서 에픽/스토리 목록을 가져오지 않아 빈 배열

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `app/(app)/projects/[projectId]/board/page.tsx` | 에픽/스토리 이슈도 별도로 조회하여 parentOptions로 전달 |
| `components/board/KanbanBoardWrapper.tsx` | parentOptions prop 추가 |
| `components/board/KanbanBoard.tsx` | Props에 parentOptions 추가, Column에 전달 |

### 구현
- 보드 페이지에서 `EPIC`/`STORY` 타입 이슈를 DB에서 조회
- `{ id, title, type }` 형태로 KanbanBoard → Column → IssueFormDialog에 전달

---

## Phase 2: 사이드바 X/전체보기 버튼 겹침 해결

### 원인
- `sheet.tsx`의 SheetContent가 `absolute top-4 right-4`에 X 버튼을 자동 렌더링
- `IssueDetailSheet.tsx`의 헤더에서 ExternalLink 아이콘이 같은 위치에 배치

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `components/issues/IssueDetailSheet.tsx` | SheetContent에 `showCloseButton={false}` 전달. 헤더에 X와 ExternalLink를 나란히 배치 |

### 구현
- Sheet 기본 X 버튼 비활성화 (`showCloseButton={false}`)
- SheetHeader 우측에 `[전체보기 아이콘] [X 닫기 버튼]` 순서로 명시적 배치
- 충분한 간격(gap-2)으로 분리

---

## Phase 3: 이슈 목록 칼럼 정렬 맞춤

### 원인
- **플랫 뷰**: 헤더 칼럼 폭과 FlatRow의 아이템 폭이 불일치
- **트리 뷰**: 헤더와 IssueRow의 아이템 폭 불일치

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `components/issues/IssuesPageClient.tsx` | 헤더와 FlatRow에 동일한 고정 너비 적용 |
| `components/issues/IssueTree.tsx` | 헤더와 IssueRow에 동일한 고정 너비 적용 |

### 구현 방식

**플랫 뷰 통일 칼럼:**
```
타입(w-14) | 제목(flex-1) | 직군(w-24) | 상태(w-20) | 우선순위(w-4) | 마감일(w-16) | 담당자(w-6) | 액션(w-6)
```

**트리 뷰 통일 칼럼:**
```
확장+제목(flex-1, depth indent) | 직군(w-24) | 상태(w-20) | 우선순위(w-14) | 담당자(w-6) | 액션(w-6)
```

---

## Phase 4: 전체 UI 최적화

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `components/issues/IssueDetailSheet.tsx` | Sheet 너비 확대, 패딩/간격 조정 |
| `components/issues/IssuesPageClient.tsx` | hover 효과 일관화 |
| `components/issues/IssueTree.tsx` | hover 효과, 행 높이 일관화 |

---

---

## Phase 5: 보드 필터 기능 (분류별, 담당자별)

### 현재 상태
- 칸반 보드에 필터 UI 없음 → 모든 이슈가 무조건 표시됨
- 이슈 탭에는 이미 필터 기능이 있으나 보드에는 없음

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `components/board/KanbanBoard.tsx` | 필터 상태(filterType, filterAssignee) + 필터 바 UI + 칼럼별 이슈 필터링 |

### 구현
- KanbanBoard 상단에 필터 바 추가 (DndContext 바깥, 보드 위쪽)
- **분류 필터**: "모든 타입" / "STORY" / "TASK" (보드에 EPIC은 이미 제외)
- **담당자 필터**: "모든 담당자" / "미배정" / 각 멤버 이름
- 필터 적용 방식: `columns` 데이터를 렌더링 시 `.filter()`로 클라이언트 필터링
  - 드래그앤드롭은 원본 columns 기준으로 유지 (필터는 뷰만 변경)
  - 필터 초기화 버튼 포함
- 필터 활성화 시 각 칼럼의 카운트도 필터된 수 표시

---

---

## Phase 6: 카드 진행도 바 + 직군 진행 시 자동 상태 이동

### 6-1. 칸반 카드에 진행도 바 추가

**파일**: `components/board/KanbanCard.tsx`

- disciplineWorks 데이터에서 진행도 계산:
  - 담당자가 지정된 직군만 카운트 (미지정은 무시 — Phase 1 로직과 일관)
  - `DONE 수 / 담당자 지정 총 수 * 100` = 퍼센트
- 직군 배지 아래에 가로 프로그레스 바 렌더링
  - 배경: `bg-muted`, 채움: `bg-primary` (진행도에 따라 width %)
  - 우측에 `2/5` 형태 텍스트 표시
  - 담당자 지정 직군이 0개면 바 미표시

### 6-2. 직군 IN_PROGRESS 시 이슈 자동 "진행 중" 이동

**파일**: `app/api/projects/[projectId]/issues/[issueId]/discipline-works/[dwId]/route.ts`

현재: `status === "DONE"` 일 때만 자동 완료 로직 존재
추가: `status === "IN_PROGRESS"` 일 때 이슈를 "진행 중" 상태로 자동 이동

로직:
```
if (status === "IN_PROGRESS") {
  // 현재 이슈의 보드 상태 확인
  const issue = findUnique(issueId)
  const currentStatus = findUnique(issue.boardStatusId)
  // 첫 번째(order=0) 상태에 있을 때만 자동 이동 (이미 다른 곳이면 건드리지 않음)
  const firstStatus = findFirst({ projectId, order 최소 })
  if (issue.boardStatusId === firstStatus.id) {
    // 두 번째 상태(진행 중)로 이동
    const inProgressStatus = findFirst({ projectId, order > firstStatus.order, isFinal: false })
    if (inProgressStatus) {
      issue.update({ boardStatusId: inProgressStatus.id })
      activityLog.create("AUTO_COMPLETED", "직군 진행 시작 → {statusName}")
    }
  }
}
```

핵심 규칙:
- **첫 번째 상태(할 일)에 있을 때만** 자동 이동 → 사용자가 수동으로 다른 상태에 둔 경우 건드리지 않음
- `isFinal: false`인 두 번째 상태로 이동 (보통 "진행 중")
- ActivityLog 기록

---

## 수정 파일 총 목록

| 파일 | Phase |
|------|-------|
| `app/(app)/projects/[projectId]/board/page.tsx` | 1 |
| `components/board/KanbanBoardWrapper.tsx` | 1 |
| `components/board/KanbanBoard.tsx` | 1, 5 |
| `components/issues/IssueDetailSheet.tsx` | 2, 4 |
| `components/issues/IssuesPageClient.tsx` | 3, 4 |
| `components/issues/IssueTree.tsx` | 3, 4 |
| `components/board/KanbanCard.tsx` | 6 |
| `app/api/.../discipline-works/[dwId]/route.ts` | 6 |

## 검증 계획

1. 보드에서 "+" → 이슈 만들기 → 상위 이슈 드롭다운에 에픽/스토리 표시 확인
2. 보드 카드 클릭 → 사이드 시트 → X와 전체보기 아이콘 겹치지 않음 확인
3. 이슈 탭 → 트리/플랫 모드 전환 → 헤더와 행 칼럼 정렬 일치 확인
4. 보드 → 분류 필터 "TASK" 선택 → TASK만 표시 / 담당자 필터 → 해당 멤버 카드만 표시
5. 칸반 카드에 진행도 바 표시 확인 (담당자 지정 직군 기준)
6. 직군 작업을 IN_PROGRESS로 변경 → "할 일" 컬럼에 있던 이슈가 "진행 중"으로 자동 이동 확인
7. `npm run build` 0 errors

---

---

# 구현 계획: 보드 UI Jira 스타일 개선 (4 Phase) — ✅ 완료

커밋: `e0910d6` (2026-03-05)

## 완료 항목

- [x] Phase 1: 칸반 컬럼 배경색 — 상단 색상 바 + 연한 배경 + 드래그 오버 강조
- [x] Phase 2: 카드 마감일 pill 배지 — D-day 기반 빨강/주황/기본 3단계 (CalendarDays 아이콘)
- [x] Phase 3: 우선순위 화살표 아이콘 — PriorityIcon 공통 컴포넌트 (ChevronsUp/ChevronUp/Minus/ChevronDown)
  - 적용: KanbanCard, IssueTree, IssuesPageClient, IssueDetailSheet, IssueDetailClient
- [x] Phase 4: 이슈 상세 빈 공백 축소 — max-w-5xl, padding/gap 조정
- [x] 추가: IssueDetailSheet sr-only SheetTitle (접근성 경고 해결)
- [x] 추가: next.config cpus 4→2 (Jest worker crash 방지)

## 이전 계획

(이전 구현 계획은 이 문서에서 제거됨 — 직군 자동 생성 + 보드 사이드 시트 구현 완료)
