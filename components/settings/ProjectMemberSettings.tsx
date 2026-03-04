"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2, Crown, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Member = { id: string; name: string; email: string; color: string };
type ProjectMember = {
  memberId: string;
  role: "OWNER" | "MEMBER";
  member: Member;
};

type Props = {
  projectId: string;
  projectMembers: ProjectMember[];
  allMembers: Member[];
};

export function ProjectMemberSettings({ projectId, projectMembers, allMembers }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState<ProjectMember[]>(projectMembers);
  const [selectedId, setSelectedId] = useState("");
  const [adding, setAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ProjectMember | null>(null);
  const [loading, setLoading] = useState(false);

  const currentIds = new Set(members.map((pm) => pm.memberId));
  const available = allMembers.filter((m) => !currentIds.has(m.id));

  async function handleAdd() {
    if (!selectedId) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedId }),
      });
      if (res.ok) {
        const created = await res.json();
        setMembers((prev) => [...prev, created]);
        setSelectedId("");
        router.refresh();
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/members?memberId=${removeTarget.memberId}`, {
        method: "DELETE",
      });
      setMembers((prev) => prev.filter((pm) => pm.memberId !== removeTarget.memberId));
      setRemoveTarget(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">총 {members.length}명</p>
        {available.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-44 h-8 text-sm">
                <SelectValue placeholder="팀원 선택" />
              </SelectTrigger>
              <SelectContent>
                {available.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} disabled={!selectedId || adding}>
              {adding ? "추가 중..." : "추가"}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {members.map((pm) => (
          <div key={pm.memberId} className="flex items-center gap-3 p-3 border rounded-lg">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
              style={{ backgroundColor: pm.member.color }}
            >
              {pm.member.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{pm.member.name}</p>
              <p className="text-xs text-muted-foreground truncate">{pm.member.email}</p>
            </div>
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
              pm.role === "OWNER"
                ? "bg-amber-100 text-amber-700"
                : "bg-muted text-muted-foreground"
            }`}>
              {pm.role === "OWNER" ? <Crown size={10} /> : <User size={10} />}
              {pm.role === "OWNER" ? "오너" : "멤버"}
            </span>
            {pm.role !== "OWNER" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => setRemoveTarget(pm)}
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">프로젝트 멤버가 없습니다.</p>
      )}

      <AlertDialog open={Boolean(removeTarget)} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>멤버를 제거하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeTarget?.member.name}</strong>을 프로젝트에서 제거합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "제거 중..." : "제거"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
