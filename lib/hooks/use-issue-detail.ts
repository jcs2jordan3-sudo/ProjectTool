"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

// ── useIssueDetail ────────────────────────────────────────────
// GET /api/projects/{projectId}/issues/{issueId}
export function useIssueDetail(projectId: string, issueId: string | null) {
  return useQuery({
    queryKey: ["projects", projectId, "issues", issueId],
    queryFn: () => apiFetch(`/api/projects/${projectId}/issues/${issueId}`),
    enabled: !!issueId,
  });
}

// ── 공통: 캐시 무효화 키 ──────────────────────────────────────
function issueInvalidationKeys(projectId: string) {
  return [
    ["projects", projectId, "issues"],
    ["projects", projectId, "kanbanIssues"],
  ] as const;
}

// ── useUpdateIssueField ───────────────────────────────────────
// PATCH /api/projects/{projectId}/issues/{issueId}
export function useUpdateIssueField(projectId: string, issueId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/projects/${projectId}/issues/${issueId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      issueInvalidationKeys(projectId).forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
      router.refresh();
    },
  });
}

// ── useAddComment ─────────────────────────────────────────────
// POST /api/projects/{projectId}/issues/{issueId}/comments
type AddCommentVars = {
  authorName: string;
  content: string;
};

export function useAddComment(projectId: string, issueId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (vars: AddCommentVars) =>
      apiFetch(`/api/projects/${projectId}/issues/${issueId}/comments`, {
        method: "POST",
        body: JSON.stringify(vars),
      }),
    onSuccess: () => {
      issueInvalidationKeys(projectId).forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
      router.refresh();
    },
  });
}

// ── useAddDisciplineWork ──────────────────────────────────────
// POST /api/projects/{projectId}/issues/{issueId}/discipline-works
export function useAddDisciplineWork(projectId: string, issueId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (disciplineId: string) =>
      apiFetch(
        `/api/projects/${projectId}/issues/${issueId}/discipline-works`,
        {
          method: "POST",
          body: JSON.stringify({ disciplineId }),
        }
      ),
    onSuccess: () => {
      issueInvalidationKeys(projectId).forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
      router.refresh();
    },
  });
}

// ── useUpdateDisciplineWork ───────────────────────────────────
// PATCH /api/projects/{projectId}/issues/{issueId}/discipline-works/{dwId}
type UpdateDisciplineWorkVars = {
  dwId: string;
  data: Record<string, unknown>;
};

export function useUpdateDisciplineWork(projectId: string, issueId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ dwId, data }: UpdateDisciplineWorkVars) =>
      apiFetch(
        `/api/projects/${projectId}/issues/${issueId}/discipline-works/${dwId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      issueInvalidationKeys(projectId).forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
      router.refresh();
    },
  });
}

// ── useDeleteDisciplineWork ───────────────────────────────────
// DELETE /api/projects/{projectId}/issues/{issueId}/discipline-works/{dwId}
export function useDeleteDisciplineWork(projectId: string, issueId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (dwId: string) =>
      apiFetch(
        `/api/projects/${projectId}/issues/${issueId}/discipline-works/${dwId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      issueInvalidationKeys(projectId).forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
      router.refresh();
    },
  });
}
