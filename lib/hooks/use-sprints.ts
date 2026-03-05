import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── 타입 ────────────────────────────────────────────────────────────────────

export type Issue = {
  id: string;
  type: "EPIC" | "STORY" | "TASK";
  title: string;
  priority: string;
  assignee?: { id: string; name: string; color: string } | null;
  boardStatus?: { isFinal: boolean } | null;
  sprintId?: string | null;
};

export type Sprint = {
  id: string;
  name: string;
  goal?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
  issues: Issue[];
};

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const sprintKeys = {
  list: (projectId: string) => ["projects", projectId, "sprints"] as const,
  backlog: (projectId: string) =>
    ["projects", projectId, "backlogIssues"] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useSprints(projectId: string, initialData?: Sprint[]) {
  return useQuery<Sprint[]>({
    queryKey: sprintKeys.list(projectId),
    queryFn: () => apiFetch<Sprint[]>(`/api/projects/${projectId}/sprints`),
    initialData,
  });
}

export function useBacklogIssues(projectId: string, initialData?: Issue[]) {
  return useQuery<Issue[]>({
    queryKey: sprintKeys.backlog(projectId),
    queryFn: () =>
      apiFetch<Issue[]>(
        `/api/projects/${projectId}/issues?sprintId=none&type=notEpic`,
      ),
    initialData,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useMoveToSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sprintId,
      issueIds,
    }: {
      sprintId: string;
      issueIds: string[];
    }) =>
      apiFetch(`/api/projects/${projectId}/sprints/${sprintId}/issues`, {
        method: "POST",
        body: JSON.stringify({ issueIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.list(projectId) });
      queryClient.invalidateQueries({
        queryKey: sprintKeys.backlog(projectId),
      });
    },
  });
}

export function useRemoveFromSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sprintId,
      issueIds,
    }: {
      sprintId: string;
      issueIds: string[];
    }) =>
      apiFetch(`/api/projects/${projectId}/sprints/${sprintId}/issues`, {
        method: "DELETE",
        body: JSON.stringify({ issueIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.list(projectId) });
      queryClient.invalidateQueries({
        queryKey: sprintKeys.backlog(projectId),
      });
    },
  });
}

export function useStartSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId }: { sprintId: string }) =>
      apiFetch(`/api/projects/${projectId}/sprints/${sprintId}/start`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.list(projectId) });
    },
  });
}

export function useCompleteSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId }: { sprintId: string }) =>
      apiFetch<{ movedToBacklog: number }>(
        `/api/projects/${projectId}/sprints/${sprintId}/complete`,
        { method: "POST" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.list(projectId) });
      queryClient.invalidateQueries({
        queryKey: sprintKeys.backlog(projectId),
      });
    },
  });
}

export function useDeleteSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId }: { sprintId: string }) =>
      apiFetch(`/api/projects/${projectId}/sprints/${sprintId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.list(projectId) });
      queryClient.invalidateQueries({
        queryKey: sprintKeys.backlog(projectId),
      });
    },
  });
}

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      name: string;
      goal?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    }) =>
      apiFetch<Sprint>(`/api/projects/${projectId}/sprints`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.list(projectId) });
    },
  });
}

export function useUpdateSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sprintId,
      ...body
    }: {
      sprintId: string;
      name: string;
      goal?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    }) =>
      apiFetch<Sprint>(`/api/projects/${projectId}/sprints/${sprintId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.list(projectId) });
    },
  });
}
