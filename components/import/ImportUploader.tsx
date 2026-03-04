"use client";

import { useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  onParsed: (file: File) => void;
};

export function ImportUploader({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
      alert("CSV 또는 Excel 파일(.xlsx, .xls, .csv)만 지원합니다.");
      return;
    }
    onParsed(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 transition-colors cursor-pointer",
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/20"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
        <Upload size={24} className="text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="font-medium">파일을 드래그하거나 클릭해서 선택</p>
        <p className="text-sm text-muted-foreground mt-1">.csv, .xlsx, .xls 지원</p>
      </div>
      <Button variant="outline" size="sm" type="button">
        <FileText size={14} className="mr-1.5" />
        파일 선택
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
