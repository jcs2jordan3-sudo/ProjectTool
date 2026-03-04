# Webserive - 기능 명세 (MVP 구현 완료)

## 구현된 기능 목록

### 1. 팀원 관리
- 관리자가 이름/이메일/색상/slack_user_id 직접 등록
- `GET/POST /api/members`, `PATCH/DELETE /api/members/[id]`

### 2. 프로젝트
- 생성/수정/삭제, 멤버 배정
- `GET/POST /api/projects`, `PATCH/DELETE /api/projects/[projectId]`

### 3. 커스텀 보드 상태
- 프로젝트별 칸반 컬럼 추가/수정/삭제/드래그 순서변경
- `is_final=true` 컬럼이 완료 상태 (진행률 계산 기준)
- `GET/POST /api/projects/[projectId]/board-statuses`
- `PATCH/DELETE /api/projects/[projectId]/board-statuses/[statusId]`
- `POST /api/projects/[projectId]/board-statuses/reorder`

### 4. 직군 (Discipline)
- 프로젝트별 직군 관리 (기획/개발/아트/애니메이션 기본)
- Task의 직군별 체크리스트 (DisciplineWork): 모두 DONE → Task 자동 완료
- `GET/POST /api/projects/[projectId]/disciplines`
- `GET/POST/PATCH/DELETE /api/projects/[projectId]/issues/[issueId]/discipline-works`

### 5. 이슈 (Epic > Story > Task)
- 3단계 계층 구조 (self-referential parent_id)
- 담당자, 우선순위(URGENT/HIGH/MEDIUM/LOW), 상태, 레이블, 마감일
- `GET/POST /api/projects/[projectId]/issues`
- `GET/PATCH/DELETE /api/projects/[projectId]/issues/[issueId]`
- `POST /api/projects/[projectId]/issues/reorder`

### 6. 스프린트
- 기간 자유 설정 (PLANNED → ACTIVE → COMPLETED)
- 이슈 백로그 ↔ 스프린트 이동
- 완료 시 미완료 이슈 자동 백로그 이동
- `GET/POST /api/projects/[projectId]/sprints`
- `PATCH/DELETE /api/projects/[projectId]/sprints/[sprintId]`
- `POST /api/projects/[projectId]/sprints/[sprintId]/start`
- `POST /api/projects/[projectId]/sprints/[sprintId]/complete`
- `POST/DELETE /api/projects/[projectId]/sprints/[sprintId]/issues`

### 7. 댓글
- 이슈 내 댓글 CRUD + @멘션
- `GET/POST /api/projects/[projectId]/issues/[issueId]/comments`

### 8. 파일 첨부
- Supabase Storage 업로드 (최대 20MB)
- 버킷명: `attachments` (Public 버킷 — 수동 생성 필요)
- `POST /api/projects/[projectId]/issues/[issueId]/attachments`
- `DELETE /api/projects/[projectId]/issues/[issueId]/attachments/[attachmentId]`

### 9. CSV/Excel Import
- SheetJS로 .csv/.xlsx 파싱
- 지원 컬럼: type, title, description, priority, status, assignee_email, due_date, parent_title, labels, sprint_name
- 계층 처리: EPIC → STORY → TASK 순서 생성
- `POST /api/projects/[projectId]/import`

### 10. 슬랙 알림
- Incoming Webhook으로 채널 알림
- 트리거: 담당자 변경, 상태 변경, 댓글 등록
- 프로젝트 설정 > 알림에서 Webhook URL 설정
- `PATCH /api/projects/[projectId]` (slackWebhook 필드)

### 11. ActivityLog
- 이슈 모든 변경 이력 자동 기록
- action_type: STATUS_CHANGED, ASSIGNEE_CHANGED, TITLE_CHANGED, SPRINT_ASSIGNED, COMMENT_ADDED, DISCIPLINE_UPDATED

## 데이터 모델

```prisma
Member        # id, name, email, color, slackUserId
Project       # id, name, description, slackWebhook
ProjectMember # projectId, memberId, role
BoardStatus   # id, projectId, name, color, order, isFinal
Discipline    # id, projectId, name, color, order
Sprint        # id, projectId, name, goal, startDate, endDate, status
Issue         # id, projectId, sprintId?, parentId?, type, title,
              # boardStatusId, priority, assigneeId?, dueDate, order
DisciplineWork # id, issueId, disciplineId, assigneeId?, status, notes
Comment       # id, issueId, authorName, content
Attachment    # id, issueId, fileUrl, fileName, fileSize, mimeType
ActivityLog   # id, issueId, memberId?, actionType, oldValue, newValue
Label         # id, projectId, name, color
```

## Phase Auth (추후 구현 예정)

- Supabase Auth 이메일 로그인
- 관리자 승인 기반 회원가입 (Member.status: PENDING → ACTIVE)
- Slack Bot API 개인 DM 알림
- Resend 이메일 알림
