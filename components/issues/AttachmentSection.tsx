"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText, Image, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType?: string | null;
};

type Props = {
  projectId: string;
  issueId: string;
  attachments: Attachment[];
  onRefresh: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType?: string | null, fileName?: string): boolean {
  if (mimeType?.startsWith("image/")) return true;
  const ext = fileName?.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext ?? "");
}

function FileIcon({ mimeType, fileName }: { mimeType?: string | null; fileName: string }) {
  if (isImage(mimeType, fileName)) return <Image size={16} className="text-blue-400 shrink-0" />;
  if (mimeType?.includes("pdf")) return <FileText size={16} className="text-red-400 shrink-0" />;
  return <File size={16} className="text-muted-foreground shrink-0" />;
}

export function AttachmentSection({ projectId, issueId, attachments, onRefresh }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function uploadFile(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      setError("파일 크기는 20MB 이하여야 합니다.");
      return;
    }
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(
      `/api/projects/${projectId}/issues/${issueId}/attachments`,
      { method: "POST", body: form }
    );
    setUploading(false);
    if (res.ok) {
      onRefresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "업로드 실패");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) uploadFile(files[0]);
  }

  async function handleDelete(attachmentId: string) {
    setDeletingId(attachmentId);
    await fetch(
      `/api/projects/${projectId}/issues/${issueId}/attachments/${attachmentId}`,
      { method: "DELETE" }
    );
    setDeletingId(null);
    onRefresh();
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">파일 첨부 ({attachments.length})</h3>

      {/* 기존 첨부파일 */}
      {attachments.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 border rounded-md px-3 py-2 group hover:bg-muted/30">
              <FileIcon mimeType={att.mimeType} fileName={att.fileName} />

              {/* 이미지 미리보기 */}
              {isImage(att.mimeType, att.fileName) ? (
                <a
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <img
                    src={att.fileUrl}
                    alt={att.fileName}
                    className="w-10 h-10 object-cover rounded border shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate text-blue-600 hover:underline">{att.fileName}</p>
                    <p className="text-[10px] text-muted-foreground">{formatBytes(att.fileSize)}</p>
                  </div>
                </a>
              ) : (
                <a
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-medium truncate text-blue-600 hover:underline">{att.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">{formatBytes(att.fileSize)}</p>
                </a>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => handleDelete(att.id)}
                disabled={deletingId === att.id}
              >
                {deletingId === att.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 영역 */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/10"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            업로드 중...
          </div>
        ) : (
          <>
            <Upload size={16} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center">
              파일을 드래그하거나 클릭해서 첨부
              <br />
              <span className="text-[10px]">최대 20MB · 모든 형식</span>
            </p>
          </>
        )}
      </div>

      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
