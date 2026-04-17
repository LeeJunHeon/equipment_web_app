import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const photo = await prisma.equipmentPhoto.findUnique({
      where: { id: Number(id) },
    });

    if (!photo) {
      return NextResponse.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });
    }

    const buffer = Buffer.from(photo.fileData, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": photo.mimeType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET /api/photos/[id] error:", error);
    return NextResponse.json({ error: "사진 조회 실패" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.equipmentPhoto.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/photos/[id] error:", error);
    return NextResponse.json({ error: "사진 삭제 실패" }, { status: 500 });
  }
}
