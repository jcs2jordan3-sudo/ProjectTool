"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type Member = {
  id: string;
  name: string;
  email: string;
  color: string;
  slackUserId: string | null;
  status: string;
  createdAt: Date | string;
};

export function useMembers(initialData?: Member[]) {
  return useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: () => apiFetch<Member[]>("/api/members"),
    initialData,
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      apiFetch<void>(`/api/members/${memberId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}
