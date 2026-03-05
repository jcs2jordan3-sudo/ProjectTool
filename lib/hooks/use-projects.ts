"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date | string;
  _count: { issues: number };
  members: { member: { id: string; name: string; color: string } }[];
};

export function useProjects(initialData?: Project[]) {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => apiFetch<Project[]>("/api/projects"),
    initialData,
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      apiFetch<void>(`/api/projects/${projectId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
