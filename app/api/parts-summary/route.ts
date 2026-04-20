import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get("equipmentId");

    const where: Record<string, unknown> = {
      eventType: "repair",
      replacedParts: { not: null },
    };
    if (equipmentId) where.equipmentId = Number(equipmentId);

    const logs = await prisma.equipmentLog.findMany({
      where,
      select: {
        id: true,
        replacedParts: true,
        occurredAt: true,
        equipment: { select: { name: true } },
      },
      orderBy: { occurredAt: "desc" },
    });

    // 부품 빈도 집계
    const partsCount: Record<string, { count: number; totalQty: number; lastDate: string }> = {};

    for (const log of logs) {
      if (!log.replacedParts) continue;

      let parts: { name: string; qty: number }[] = [];

      try {
        // JSON 형식 (신규)
        const parsed = JSON.parse(log.replacedParts);
        if (Array.isArray(parsed)) {
          parts = parsed;
        }
      } catch {
        // 텍스트 형식 (기존 데이터) — 쉼표로 분리해서 name만 추출
        const names = log.replacedParts
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean);
        parts = names.map((name) => ({ name, qty: 1 }));
      }

      for (const part of parts) {
        if (!part.name) continue;
        const key = part.name;
        if (!partsCount[key]) {
          partsCount[key] = {
            count: 0,
            totalQty: 0,
            lastDate: log.occurredAt.toISOString(),
          };
        }
        partsCount[key].count += 1;
        partsCount[key].totalQty += part.qty ?? 1;
        // 가장 최근 날짜 유지
        if (log.occurredAt.toISOString() > partsCount[key].lastDate) {
          partsCount[key].lastDate = log.occurredAt.toISOString();
        }
      }
    }

    // 빈도 내림차순 정렬
    const result = Object.entries(partsCount)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/parts-summary error:", error);
    return NextResponse.json({ error: "부품 집계 실패" }, { status: 500 });
  }
}
