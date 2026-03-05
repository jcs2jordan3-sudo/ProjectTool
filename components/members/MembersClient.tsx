"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { MemberFormDialog } from "./MemberFormDialog";
import { useMembers, useDeleteMember } from "@/lib/hooks/use-members";

type Member = {
  id: string;
  name: string;
  email: string;
  color: string;
  slackUserId: string | null;
  status: string;
  createdAt: Date | string;
};

type Props = {
  initialMembers: Member[];
};

export function MembersClient({ initialMembers }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: members = initialMembers } = useMembers(initialMembers);
  const deleteMember = useDeleteMember();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    deleteMember.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        router.refresh();
      },
    });
  }

  function handleFormSuccess() {
    queryClient.invalidateQueries({ queryKey: ["members"] });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            총 {members.length}명의 팀원이 등록되어 있습니다.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          팀원 추가
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm">등록된 팀원이 없습니다.</p>
          <Button size="sm" className="mt-4" onClick={() => setAddOpen(true)}>
            <Plus size={14} />
            첫 팀원 추가하기
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">아바타</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>Slack ID</TableHead>
              <TableHead className="w-24 text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name[0]}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {member.slackUserId ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditTarget(member)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(member)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* 추가 다이얼로그 */}
      <MemberFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={handleFormSuccess}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <MemberFormDialog
          open={Boolean(editTarget)}
          onOpenChange={(open) => !open && setEditTarget(null)}
          initial={{
            id: editTarget.id,
            name: editTarget.name,
            email: editTarget.email,
            color: editTarget.color,
            slackUserId: editTarget.slackUserId ?? "",
          }}
          onSuccess={() => {
            setEditTarget(null);
            handleFormSuccess();
          }}
        />
      )}

      {/* 삭제 확인 */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>팀원을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong>({deleteTarget?.email}) 팀원을 삭제합니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMember.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMember.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
