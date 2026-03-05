import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabaseServer, STORAGE_BUCKET } from "@/lib/supabase-server";

type Params = { params: Promise<{ projectId: string; issueId: string }> };

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: Request, { params }: Params) {
  try {
    const { issueId, projectId } = await params;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "파일 크기는 20MB 이하여야 합니다." }, { status: 400 });
    }

    // 이슈 존재 여부 확인
    const issue = await db.issue.findUnique({ where: { id: issueId, projectId }, select: { id: true } });
    if (!issue) {
      return NextResponse.json({ error: "이슈를 찾을 수 없습니다." }, { status: 404 });
    }

    // 파일명 안전하게 정리 (경로 순회 문자 제거)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._\-가-힣]/g, "_");
    const storagePath = `${projectId}/${issueId}/${Date.now()}_${safeFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseServer.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "파일 업로드에 실패했습니다." }, { status: 500 });
    }

    // Public URL 생성
    const { data: urlData } = supabaseServer.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // DB에 저장
    const attachment = await db.attachment.create({
      data: {
        issueId,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || null,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (err) {
    console.error("Attachment upload error:", err);
    return NextResponse.json({ error: "파일 업로드에 실패했습니다." }, { status: 500 });
  }
}
