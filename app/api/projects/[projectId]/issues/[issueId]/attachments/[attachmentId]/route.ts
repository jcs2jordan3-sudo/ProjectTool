import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";

type Params = { params: Promise<{ projectId: string; issueId: string; attachmentId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { issueId, attachmentId, projectId } = await params;

    const attachment = await db.attachment.findUnique({
      where: { id: attachmentId, issueId },
    });
    if (!attachment) {
      return NextResponse.json({ error: "첨부파일을 찾을 수 없습니다." }, { status: 404 });
    }

    // Storage에서 삭제 (URL에서 경로 추출)
    const url = new URL(attachment.fileUrl);
    // publicUrl 형식: /storage/v1/object/public/{bucket}/{path}
    const pathMatch = url.pathname.match(
      new RegExp(`/storage/v1/object/public/${STORAGE_BUCKET}/(.+)`)
    );
    if (pathMatch?.[1]) {
      const storagePath = pathMatch[1];
      // path traversal 방어
      if (storagePath.includes("..") || storagePath.startsWith("/")) {
        return NextResponse.json({ error: "잘못된 파일 경로입니다." }, { status: 400 });
      }
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    }

    await db.attachment.delete({ where: { id: attachmentId } });

    void projectId;
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Attachment delete error:", err);
    return NextResponse.json({ error: "파일 삭제에 실패했습니다." }, { status: 500 });
  }
}
