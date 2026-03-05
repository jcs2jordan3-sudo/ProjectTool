"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { KanbanIssue } from "@/components/board/KanbanCard";

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const issueKeys = {
  all: (projectId: string) => ["projects", projectId, "issues"] as const,
  kanban: (projectId: string) => ["projects", projectId, "kanbanIssues"] as const,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReorderPayload = {
  issueId: string;
  boardStatusId: string;
  orderedIds: string[];
};

type CreateIssuePayload = Record<string, unknown>;
type UpdateIssuePayload = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * 칸반 보드용 이슈 목록 쿼리.
 * SSR에서 받아온 initialData를 initialData 옵션으로 주입해 첫 렌더를 즉시 채운다.
 * (마치 서버에서 미리 채워 둔 선반처럼, 첫 요청 없이 데이터를 보여 준다.)
 */
export function useKanbanIssues(projectId: string, initialData?: KanbanIssue[]) {
  return useQuery<KanbanIssue[]>({
    queryKey: issueKeys.kanban(projectId),
    queryFn: () =>
      apiFetch<KanbanIssue[]>(`/api/projects/${projectId}/issues?view=kanban`),
    initialData: initialData,
    staleTime: 30 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * 이슈 순서/컬럼 변경 mutation.
 * 낙관적 업데이트는 KanbanBoard 내부 state에서 처리하므로,
 * 여기서는 서버 동기화 후 invalidate만 수행한다.
 */
export function useReorderIssues(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReorderPayload>({
    mutationFn: (payload) =>
      apiFetch<void>(`/api/projects/${projectId}/issues/reorder`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidateIssueQueries(queryClient, projectId);
    },
  });
}

/**
 * 이슈 생성 mutation.
 */
export function useCreateIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<KanbanIssue, Error, CreateIssuePayload>({
    mutationFn: (payload) =>
      apiFetch<KanbanIssue>(`/api/projects/${projectId}/issues`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidateIssueQueries(queryClient, projectId);
    },
  });
}

/**
 * 이슈 수정 mutation.
 */
export function useUpdateIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<KanbanIssue, Error, { issueId: string; data: UpdateIssuePayload }>({
    mutationFn: ({ issueId, data }) =>
      apiFetch<KanbanIssue>(`/api/projects/${projectId}/issues/${issueId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidateIssueQueries(queryClient, projectId);
    },
  });
}

/**
 * 이슈 삭제 mutation.
 */
export function useDeleteIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (issueId) =>
      apiFetch<void>(`/api/projects/${projectId}/issues/${issueId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidateIssueQueries(queryClient, projectId);
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function invalidateIssueQueries(queryClient: QueryClient, projectId: string) {
  queryClient.invalidateQueries({ queryKey: issueKeys.all(projectId) });
  queryClient.invalidateQueries({ queryKey: issueKeys.kanban(projectId) });
}
