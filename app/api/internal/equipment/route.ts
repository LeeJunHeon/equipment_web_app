import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEquipReadAuth } from "@/lib/internal-auth";

export const dynamic = "force-dynamic";

// GET /api/internal/equipment — 활성 장비 목록(요약).
export async function GET(request: Request) {
  const auth = requireEquipReadAuth(request);
  if (!auth.ok) return auth.response;
  try {
    const equipments = await prisma.equipment.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        isVentTarget: true,
        isCleaningTarget: true,
        ventIntervalDays: true,
        cleaningIntervalDays: true,
        description: true,
      },
    });
    return NextResponse.json(equipments);
  } catch (error) {
    console.error("GET /api/internal/equipment error:", error);
    return NextResponse.json({ error: "장비 목록 조회 실패" }, { status: 500 });
  }
}
