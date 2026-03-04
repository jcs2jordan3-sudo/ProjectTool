"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KeyboardSensor } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, Trash2, Check } from "lucide-react";

const PRESET_COLORS = [
  "#6b7280", "#3b82f6", "#f59e0b", "#22c55e",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
];

type BoardStatus = {
  id: string;
  name: string;
  color: string;
  order: number;
  isFinal: boolean;
};

type Props = {
  projectId: string;
  initialStatuses: BoardStatus[];
};

function SortableRow({
  status,
  onUpdate,
  onDelete,
}: {
  status: BoardStatus;
  onUpdate: (id: string, data: Partial<BoardStatus>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(status.name);

  function saveName() {
    if (name.trim() && name !== status.name) {
      onUpdate(status.id, { name: name.trim() });
    }
    setEditing(false);
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-2 px-3 border rounded-lg bg-background hover:bg-accent/20">
      <button
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>

      {/* 색상 선택 */}
      <div className="relative shrink-0">
        <div
          className="w-5 h-5 rounded-full cursor-pointer border border-border"
          style={{ backgroundColor: status.color }}
          title="색상 변경"
        />
        <input
          type="color"
          value={status.color}
          onChange={(e) => onUpdate(status.id, { color: e.target.value })}
          className="absolute inset-0 opacity-0 cursor-pointer w-5 h-5"
        />
      </div>

      {/* 이름 */}
      {editing ? (
        <Input
          className="h-7 text-sm flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setName(status.name); setEditing(false); } }}
          autoFocus
        />
      ) : (
        <span
          className="flex-1 text-sm cursor-text hover:text-primary"
          onClick={() => setEditing(true)}
        >
          {status.name}
        </span>
      )}

      {/* is_final 토글 */}
      <button
        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded shrink-0 transition-colors ${
          status.isFinal
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-muted text-muted-foreground hover:bg-accent"
        }`}
        onClick={() => onUpdate(status.id, { isFinal: !status.isFinal })}
        title="완료 상태로 지정"
      >
        <Check size={10} />
        {status.isFinal ? "완료" : "미완료"}
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => onDelete(status.id)}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}

export function BoardStatusSettings({ projectId, initialStatuses }: Props) {
  const [statuses, setStatuses] = useState<BoardStatus[]>(initialStatuses);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6b7280");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = statuses.findIndex((s) => s.id === active.id);
    const newIndex = statuses.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(statuses, oldIndex, newIndex);
    setStatuses(newOrder);

    await fetch(`/api/projects/${projectId}/board-statuses/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: newOrder.map((s) => s.id) }),
    });
  }

  async function handleUpdate(id: string, data: Partial<BoardStatus>) {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    await fetch(`/api/projects/${projectId}/board-statuses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function handleDelete(id: string) {
    setStatuses((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/projects/${projectId}/board-statuses/${id}`, { method: "DELETE" });
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/board-statuses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      if (res.ok) {
        const created = await res.json();
        setStatuses((prev) => [...prev, created]);
        setNewName("");
        setNewColor("#6b7280");
        setAdding(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          드래그로 순서를 변경하고, 이름을 클릭해 편집하세요.
          <span className="ml-2 text-green-600 font-medium">완료</span> 버튼으로 자동 완료 상태를 지정합니다.
        </p>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus size={14} />
          상태 추가
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={statuses.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {statuses.map((status) => (
              <SortableRow
                key={status.id}
                status={status}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {statuses.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          보드 상태가 없습니다.
        </p>
      )}

      {/* 추가 폼 */}
      {adding && (
        <div className="flex items-center gap-2 p-3 border rounded-lg border-dashed">
          <div className="flex gap-1 shrink-0">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: newColor === c ? "#000" : "transparent" }}
                onClick={() => setNewColor(c)}
              />
            ))}
          </div>
          <Input
            className="h-7 text-sm flex-1"
            placeholder="상태 이름"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
            autoFocus
          />
          <Button size="sm" onClick={handleAdd} disabled={saving || !newName.trim()}>
            {saving ? "추가 중..." : "추가"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>취소</Button>
        </div>
      )}
    </div>
  );
}
