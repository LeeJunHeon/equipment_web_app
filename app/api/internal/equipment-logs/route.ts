import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEquipReadAuth } from "@/lib/internal-auth";

export const dynamic = "force-dynamic";

// GET /api/internal/equipment-logs?equipment=&equipmentId=&eventType=&status=&limit=
// 장비 이력(수리 repair / 벤트 vent / 클리닝 cleaning). equipment(이름) 주면 서버가 id로 변환.
export async function GET(request: Request) {
  const auth = requireEquipReadAuth(request);
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const equipmentName = searchParams.get("equipment");
    const equipmentIdParam = searchParams.get("equipmentId");
    const eventType = searchParams.get("eventType"); // repair | vent | cleaning
    const status = searchParams.get("status");       // 처리중 | 완료
    const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

    const where: Record<string, unknown> = {};
    if (equipmentIdParam) {
      where.equipmentId = Number(equipmentIdParam);
    } else if (equipmentName) {
      const eq = await prisma.equipment.findFirst({
        where: { name: { contains: equipmentName, mode: "insensitive" } },
        select: { id: true },
      });
      if (!eq) return NextResponse.json([]);
      where.equipmentId = eq.id;
    }
    if (eventType) where.eventType = eventType;
    if (status) where.status = status;

    const logs = await prisma.equipmentLog.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: limit,
      select: {
        id: true,
        eventType: true,
        occurredAt: true,
        completedAt: true,
        operator: true,
        description: true,
        status: true,
        symptom: true,
        replacedParts: true,
        isExternal: true,
        vendorName: true,
        ventReason: true,
        cleaningType: true,
        equipment: { select: { name: true } },
      },
    });

    return NextResponse.json(
      logs.map((l) => ({
        id: l.id,
        equipmentName: l.equipment?.name ?? null,
        eventType: l.eventType,
        status: l.status,
        occurredAt: l.occurredAt.toISOString(),
        completedAt: l.completedAt ? l.completedAt.toISOString() : null,
        operator: l.operator,
        description: l.description,
        symptom: l.symptom,
        replacedParts: l.replacedParts,
        isExternal: l.isExternal,
        vendorName: l.vendorName,
        ventReason: l.ventReason,
        cleaningType: l.cleaningType,
      }))
    );
  } catch (error) {
    console.error("GET /api/internal/equipment-logs error:", error);
    return NextResponse.json({ error: "장비 이력 조회 실패" }, { status: 500 });
  }
}
