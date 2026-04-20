import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 특정 수리 이력의 모든 일일 기록 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const logId = Number(id);

    const entries = await prisma.equipmentLogEntry.findMany({
      where: { logId },
      orderBy: { occurredAt: "asc" },
      include: {
        photos: {
          select: { id: true, fileName: true, fileSize: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const result = entries.map((e) => ({
      id: e.id,
      logId: e.logId,
      memo: e.memo,
      occurredAt: e.occurredAt.toISOString(),
      createdAt: e.createdAt.toISOString(),
      photos: e.photos,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/logs/[id]/entries error:", error);
    return NextResponse.json({ error: "일일 기록 조회 실패" }, { status: 500 });
  }
}

// POST: 새 일일 기록 등록
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const logId = Number(id);
    const body = await request.json();
    const { memo, occurredAt } = body;

    // memo와 occurredAt 중 하나는 있어야 함
    if (!memo && !occurredAt) {
      return NextResponse.json(
        { error: "메모 또는 발생 시각이 필요합니다." },
        { status: 400 }
      );
    }

    const entry = await prisma.equipmentLogEntry.create({
      data: {
        logId,
        memo: memo || null,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      },
      include: {
        photos: {
          select: { id: true, fileName: true, fileSize: true },
        },
      },
    });

    return NextResponse.json(
      {
        id: entry.id,
        logId: entry.logId,
        memo: entry.memo,
        occurredAt: entry.occurredAt.toISOString(),
        createdAt: entry.createdAt.toISOString(),
        photos: entry.photos,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/logs/[id]/entries error:", error);
    return NextResponse.json({ error: "일일 기록 등록 실패" }, { status: 500 });
  }
}
