"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
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
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, Trash2 } from "lucide-react";

const PRESET_COLORS = [
  "#8b5cf6", "#3b82f6", "#ec4899", "#f97316",
  "#22c55e", "#ef4444", "#eab308", "#14b8a6",
];

type Discipline = {
  id: string;
  name: string;
  color: string;
  order: number;
};

type Props = {
  projectId: string;
  initialDisciplines: Discipline[];
};

function SortableRow({
  discipline,
  onUpdate,
  onDelete,
}: {
  discipline: Discipline;
  onUpdate: (id: string, data: Partial<Discipline>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: discipline.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(discipline.name);

  function saveName() {
    if (name.trim() && name !== discipline.name) {
      onUpdate(discipline.id, { name: name.trim() });
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
          className="w-6 h-6 rounded-full border border-border"
          style={{ backgroundColor: discipline.color }}
        />
        <input
          type="color"
          value={discipline.color}
          onChange={(e) => onUpdate(discipline.id, { color: e.target.value })}
          className="absolute inset-0 opacity-0 cursor-pointer w-6 h-6"
        />
      </div>

      {/* 이름 */}
      {editing ? (
        <Input
          className="h-7 text-sm flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveName();
            if (e.key === "Escape") { setName(discipline.name); setEditing(false); }
          }}
          autoFocus
        />
      ) : (
        <span
          className="flex-1 text-sm cursor-text hover:text-primary"
          onClick={() => setEditing(true)}
        >
          {discipline.name}
        </span>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => onDelete(discipline.id)}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}

export function DisciplineSettings({ projectId, initialDisciplines }: Props) {
  const [disciplines, setDisciplines] = useState<Discipline[]>(initialDisciplines);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#8b5cf6");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = disciplines.findIndex((d) => d.id === active.id);
    const newIndex = disciplines.findIndex((d) => d.id === over.id);
    const newOrder = arrayMove(disciplines, oldIndex, newIndex);
    setDisciplines(newOrder);

    await fetch(`/api/projects/${projectId}/disciplines/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: newOrder.map((d) => d.id) }),
    });
  }

  async function handleUpdate(id: string, data: Partial<Discipline>) {
    setDisciplines((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
    await fetch(`/api/projects/${projectId}/disciplines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function handleDelete(id: string) {
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
    await fetch(`/api/projects/${projectId}/disciplines/${id}`, { method: "DELETE" });
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/disciplines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      if (res.ok) {
        const created = await res.json();
        setDisciplines((prev) => [...prev, created]);
        setNewName("");
        setNewColor("#8b5cf6");
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
          Task 이슈의 직군 체크리스트에 사용될 직군을 관리합니다.
        </p>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus size={14} />
          직군 추가
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={disciplines.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {disciplines.map((d) => (
              <SortableRow key={d.id} discipline={d} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {disciplines.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">직군이 없습니다.</p>
      )}

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
            placeholder="직군 이름 (예: QA, PM)"
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
