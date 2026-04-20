import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "heic", "webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entryIdStr = formData.get("entryId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }
    if (!entryIdStr) {
      return NextResponse.json({ error: "entryId가 필요합니다." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 10MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `허용되지 않는 파일 형식입니다. (허용: ${[...ALLOWED_EXTENSIONS].join(", ")})` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const photo = await prisma.equipmentEntryPhoto.create({
      data: {
        entryId: Number(entryIdStr),
        fileName: file.name,
        mimeType: file.type || `image/${ext}`,
        fileData: base64,
        fileSize: file.size,
      },
    });

    return NextResponse.json(
      { id: photo.id, fileName: photo.fileName, fileSize: photo.fileSize },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/upload-entry error:", error);
    return NextResponse.json({ error: "파일 업로드 실패" }, { status: 500 });
  }
}
