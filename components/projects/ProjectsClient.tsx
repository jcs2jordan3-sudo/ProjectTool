"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Plus, Folder, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { useProjects, useDeleteProject } from "@/lib/hooks/use-projects";

type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date | string;
  _count: { issues: number };
  members: { member: { id: string; name: string; color: string } }[];
};

type Props = { initialProjects: Project[] };

export function ProjectsClient({ initialProjects }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: projects = initialProjects } = useProjects(initialProjects);
  const deleteProject = useDeleteProject();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    deleteProject.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        router.refresh();
      },
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">총 {projects.length}개의 프로젝트</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          새 프로젝트
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Folder size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">아직 프로젝트가 없습니다.</p>
          <Button size="sm" className="mt-4" onClick={() => setAddOpen(true)}>
            <Plus size={14} />첫 프로젝트 만들기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg p-4 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group relative"
              onClick={() => router.push(`/projects/${p.id}/issues`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); setEditTarget(p); }}
                    >
                      <Pencil size={14} className="mr-2" />수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                    >
                      <Trash2 size={14} className="mr-2" />삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex -space-x-1.5">
                  {p.members.slice(0, 5).map(({ member }) => (
                    <div
                      key={member.id}
                      className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-white text-[10px] font-semibold"
                      style={{ backgroundColor: member.color }}
                      title={member.name}
                    >
                      {member.name[0]}
                    </div>
                  ))}
                  {p.members.length > 5 && (
                    <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                      +{p.members.length - 5}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{p._count.issues}개 이슈</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={(id) => {
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          router.push(`/projects/${id}/issues`);
        }}
      />

      {editTarget && (
        <ProjectFormDialog
          open={Boolean(editTarget)}
          onOpenChange={(open) => !open && setEditTarget(null)}
          initial={{ id: editTarget.id, name: editTarget.name, description: editTarget.description ?? "" }}
          onSuccess={() => {
            setEditTarget(null);
            queryClient.invalidateQueries({ queryKey: ["projects"] });
          }}
        />
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> 프로젝트와 모든 이슈, 스프린트가 영구 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProject.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
