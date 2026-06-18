import { NextResponse } from "next/server";
import { requireEquipWriteAuth } from "@/lib/internal-write-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 10 * 1024 * 1024; // 10MB

// POST /api/internal/upload-photo
// body: { logId: number, photos: string[] }  (photos = data URL "data:image/jpeg;base64,...")
export async function POST(request: Request) {
  const auth = requireEquipWriteAuth(request);
  if (!auth.ok) return auth.response;

  let body: { logId?: unknown; photos?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const logId = Number(body.logId);
  const photos = Array.isArray(body.photos) ? body.photos : [];
  if (!logId || photos.length === 0) {
    return NextResponse.json({ error: "logId/photos 필요" }, { status: 400 });
  }

  let count = 0;
  for (const item of photos) {
    if (typeof item !== "string") continue;
    const m = /^data:([^;]+);base64,(.+)$/.exec(item);
    if (!m) continue;
    const mimeType = m[1];
    const base64 = m[2];
    const size = Math.floor((base64.length * 3) / 4);
    if (size > MAX) continue; // 10MB 초과 스킵
    const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
    try {
      await prisma.equipmentPhoto.create({
        data: {
          logId,
          fileName: `chat-${Date.now()}-${count}.${ext}`,
          mimeType,
          fileData: base64,
          fileSize: size,
        },
      });
      count++;
    } catch {
      // 개별 사진 실패는 스킵
    }
  }

  return NextResponse.json({ ok: true, count });
}
