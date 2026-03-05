"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSprint, useUpdateSprint } from "@/lib/hooks/use-sprints";

// ─── 타입 ────────────────────────────────────────────────────────────────────

type SprintData = {
  id: string;
  name: string;
  goal?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  sprint?: SprintData;
};

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function toInputDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
}

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────

export function SprintFormDialog({
  open,
  onOpenChange,
  projectId,
  sprint,
}: Props) {
  const [name, setName] = useState(sprint?.name ?? "");
  const [goal, setGoal] = useState(sprint?.goal ?? "");
  const [startDate, setStartDate] = useState(toInputDate(sprint?.startDate));
  const [endDate, setEndDate] = useState(toInputDate(sprint?.endDate));
  const [error, setError] = useState("");

  const createSprint = useCreateSprint(projectId);
  const updateSprint = useUpdateSprint(projectId);

  const isPending = createSprint.isPending || updateSprint.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("스프린트 이름을 입력하세요.");
      return;
    }
    setError("");

    const body = {
      name: name.trim(),
      goal: goal.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
    };

    if (sprint) {
      updateSprint.mutate(
        { sprintId: sprint.id, ...body },
        {
          onSuccess: () => onOpenChange(false),
          onError: (err) => setError(err.message),
        },
      );
    } else {
      createSprint.mutate(body, {
        onSuccess: () => onOpenChange(false),
        onError: (err) => setError(err.message),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {sprint ? "스프린트 수정" : "스프린트 생성"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint 1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal">목표 (선택)</Label>
            <Textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="이번 스프린트의 목표를 입력하세요"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "저장 중..." : sprint ? "저장" : "생성"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
