import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPmStatus, PM_CONFIG } from "@/lib/pmConfig";

export async function GET() {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 모든 활성 장비 + 이력 한 번에 조회
    const equipments = await prisma.equipment.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      include: {
        logs: {
          orderBy: { occurredAt: "desc" },
          select: {
            id: true,
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
      const repairLogs = eq.logs.filter((l) => l.eventType === "repair");
      const ventLogs = eq.logs.filter((l) => l.eventType === "vent");
      const cleaningLogs = eq.logs.filter((l) => l.eventType === "cleaning");

      // 미해결 수리
      const unresolvedRepairs = repairLogs.filter((l) => l.status === "처리중");

      // 마지막 PM 날짜
      const lastVentDate = ventLogs[0]?.occurredAt.toISOString() ?? undefined;
      const lastCleaningDate = cleaningLogs[0]?.occurredAt.toISOString() ?? undefined;

      // PM 상태
      const ventStatus = getPmStatus(lastVentDate, PM_CONFIG.ventIntervalDays);
      const cleaningStatus = getPmStatus(lastCleaningDate, PM_CONFIG.cleaningIntervalDays);

      // 이번 달 가동률 계산
      // 수리 중인 기간(시작~완료 or 시작~지금)을 비가동 시간으로 계산
      const monthDays = now.getDate(); // 이번 달 경과 일수
      let downtimeDays = 0;

      for (const repair of repairLogs) {
        const start = repair.occurredAt;
        // 완료된 수리는 완료 시점이 없으므로 status로 판단
        // 처리중이면 오늘까지, 완료면 다음 완료 기록 기준으로 계산(단순화)
        const repairStart = start < thisMonthStart ? thisMonthStart : start;

        if (repair.status === "처리중") {
          const days = Math.floor(
            (now.getTime() - repairStart.getTime()) / (1000 * 60 * 60 * 24)
          );
          downtimeDays += Math.max(0, days);
        }
      }

      const uptimePercent =
        monthDays > 0
          ? Math.max(0, Math.round(((monthDays - downtimeDays) / monthDays) * 100))
          : 100;

      return {
        id: eq.id,
        name: eq.name,
        category: eq.category,
        isVentTarget: eq.isVentTarget,
        unresolvedRepairCount: unresolvedRepairs.length,
        unresolvedRepairs: unresolvedRepairs.map((r) => ({
          id: r.id,
          symptom: r.symptom,
          operator: r.operator,
          occurredAt: r.occurredAt.toISOString(),
        })),
        lastVentDate,
        lastCleaningDate,
        ventStatus,
        cleaningStatus,
        uptimePercent,
      };
    });

    // 전체 요약
    const totalUnresolved = result.reduce((s, e) => s + e.unresolvedRepairCount, 0);
    const pmIssueCount = result.filter(
      (e) => e.ventStatus !== "normal" || e.cleaningStatus !== "normal"
    ).length;

    return NextResponse.json({ equipments: result, totalUnresolved, pmIssueCount });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "대시보드 데이터 조회 실패" }, { status: 500 });
  }
}
