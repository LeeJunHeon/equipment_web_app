import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPmStatus, getPmStatusLabel } from "@/lib/pmConfig";
import { requireEquipReadAuth } from "@/lib/internal-auth";

export const dynamic = "force-dynamic";

function ymd(d: Date): string {
  return d.toISOString().split("T")[0];
}

// GET /api/internal/equipment-status — 장비별 PM(벤트/클리닝) 점검 현황 + 미해결 수리 + 전체 요약.
// 벤트/클리닝 상태는 대상(isVentTarget/isCleaningTarget)인 장비에만 부여(비대상은 null).
export async function GET(request: Request) {
  const auth = requireEquipReadAuth(request);
  if (!auth.ok) return auth.response;
  try {
    const equipments = await prisma.equipment.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      include: {
        logs: {
          orderBy: { occurredAt: "desc" },
          select: {
            eventType: true,
            occurredAt: true,
            status: true,
            symptom: true,
            operator: true,
          },
        },
      },
    });

    const result = equipments.map((eq) => {
      const ventLogs = eq.logs.filter((l) => l.eventType === "vent");
      const cleaningLogs = eq.logs.filter((l) => l.eventType === "cleaning");
      const unresolved = eq.logs.filter(
        (l) => l.eventType === "repair" && l.status === "처리중"
      );

      const lastVent = ventLogs[0]?.occurredAt;
      const lastCleaning = cleaningLogs[0]?.occurredAt;

      const ventStatus = eq.isVentTarget
        ? getPmStatus(lastVent?.toISOString(), eq.ventIntervalDays)
        : null;
      const cleaningStatus = eq.isCleaningTarget
        ? getPmStatus(lastCleaning?.toISOString(), eq.cleaningIntervalDays)
        : null;

      return {
        id: eq.id,
        name: eq.name,
        category: eq.category,
        isVentTarget: eq.isVentTarget,
        isCleaningTarget: eq.isCleaningTarget,
        ventIntervalDays: eq.ventIntervalDays,
        cleaningIntervalDays: eq.cleaningIntervalDays,
        lastVentDate: lastVent ? ymd(lastVent) : null,
        lastCleaningDate: lastCleaning ? ymd(lastCleaning) : null,
        ventStatus,
        ventStatusLabel: ventStatus ? getPmStatusLabel(ventStatus) : null,
        cleaningStatus,
        cleaningStatusLabel: cleaningStatus ? getPmStatusLabel(cleaningStatus) : null,
        unresolvedRepairCount: unresolved.length,
        unresolvedRepairs: unresolved.map((r) => ({
          symptom: r.symptom,
          operator: r.operator,
          occurredAt: ymd(r.occurredAt),
        })),
      };
    });

    const totalUnresolved = result.reduce((s, e) => s + e.unresolvedRepairCount, 0);
    const pmIssueCount = result.filter(
      (e) =>
        (e.ventStatus !== null && e.ventStatus !== "normal") ||
        (e.cleaningStatus !== null && e.cleaningStatus !== "normal")
    ).length;

    return NextResponse.json({ equipments: result, totalUnresolved, pmIssueCount });
  } catch (error) {
    console.error("GET /api/internal/equipment-status error:", error);
    return NextResponse.json({ error: "장비 현황 조회 실패" }, { status: 500 });
  }
}
