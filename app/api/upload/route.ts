import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "heic", "webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getUploadDir(): string {
  return process.env.UPLOAD_DIR || "./public/uploads";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "파일 크기는 10MB 이하여야 합니다." }, { status: 400 });
    }

    const originalName = file.name;
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `허용되지 않는 파일 형식입니다. (허용: ${[...ALLOWED_EXTENSIONS].join(", ")})` },
        { status: 400 },
      );
    }

    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const timestamp = now.getTime();
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${timestamp}_${safeName}`;

    const baseDir = getUploadDir();
    const subDir = path.join("logs", yyyy, mm, dd);
    const fullDir = path.join(baseDir, subDir);

    await mkdir(fullDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(fullDir, fileName);
    await writeFile(filePath, buffer);

    const url = `/uploads/${subDir.replace(/\\/g, "/")}/${fileName}`;

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "파일 업로드 실패" }, { status: 500 });
  }
}
