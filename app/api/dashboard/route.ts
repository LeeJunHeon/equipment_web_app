import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPmStatus } from "@/lib/pmConfig";
import { nowKst, monthStartKst } from "@/lib/kst";
import { mergedDowntimeMs } from "@/lib/downtime";
import { REPAIR_STATUS } from "@/lib/repairStatus";

export async function GET() {
  try {
    // DB의 occurred_at / completed_at 은 "KST 벽시계를 UTC로 읽은 값"이므로
    // 비교 기준도 같은 규칙으로 만들어야 한다. (lib/kst.ts 참고)
    const now = nowKst();
    const thisMonthStart = monthStartKst();

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
            completedAt: true,
            downtimes: { select: { startedAt: true, endedAt: true } },
          },
        },
      },
    });

    const result = equipments.map((eq) => {
      const repairLogs = eq.logs.filter((l) => l.eventType === "repair");
      const ventLogs = eq.logs.filter((l) => l.eventType === "vent");
      const cleaningLogs = eq.logs.filter((l) => l.eventType === "cleaning");

      // 미해결 = 가동중 + 정지중. 뱃지·정렬은 정지중을 우선한다.
      const inProgressRepairs = repairLogs.filter((l) => l.status === REPAIR_STATUS.STOPPED);
      const needsRepairs = repairLogs.filter((l) => l.status === REPAIR_STATUS.RUNNING);
      const unresolvedRepairs = [...inProgressRepairs, ...needsRepairs];

      // 마지막 PM 날짜
      const lastVentDate = ventLogs[0]?.occurredAt.toISOString() ?? undefined;
      const lastCleaningDate = cleaningLogs[0]?.occurredAt.toISOString() ?? undefined;

      // PM 상태
      const ventStatus = getPmStatus(lastVentDate, eq.ventIntervalDays);
      const cleaningStatus = eq.isCleaningTarget === false
        ? "normal"
        : getPmStatus(lastCleaningDate, eq.cleaningIntervalDays);

      // 이번 달 기준 시간(ms)
      const monthDays = now.getUTCDate();
      const monthTotalMs = monthDays * 24 * 60 * 60 * 1000;
      const monthStartMs = thisMonthStart.getTime();
      const nowMs = now.getTime();

      // 비가동은 정지 구간(equipment_downtimes) 만으로 계산한다.
      // 상태는 구간의 열림/닫힘에 이미 반영돼 있으므로 따로 거르지 않는다.
      // 이번 달 밖의 구간은 잘라내기 과정에서 자동으로 걸러진다.
      const allRanges = repairLogs.flatMap((l) => l.downtimes);
      const downtimeMs = mergedDowntimeMs(allRanges, monthStartMs, nowMs);
      const uptimePercent =
        monthTotalMs > 0
          ? Math.max(0, Math.round((1 - downtimeMs / monthTotalMs) * 100))
          : 100;
      const downtimeHours = Math.round(downtimeMs / (1000 * 60 * 60));

      return {
        id: eq.id,
        name: eq.name,
        category: eq.category,
        isVentTarget: eq.isVentTarget,
        isCleaningTarget: eq.isCleaningTarget,
        unresolvedRepairCount: unresolvedRepairs.length,
        inProgressRepairCount: inProgressRepairs.length,
        needsRepairCount: needsRepairs.length,
        unresolvedRepairs: unresolvedRepairs.map((r) => ({
          id: r.id,
          symptom: r.symptom,
          operator: r.operator,
          status: r.status,
          occurredAt: r.occurredAt.toISOString(),
        })),
        lastVentDate,
        lastCleaningDate,
        ventStatus,
        cleaningStatus,
        uptimePercent,
        downtimeHours,
        ventIntervalDays: eq.ventIntervalDays,
        cleaningIntervalDays: eq.cleaningIntervalDays,
      };
    });

    // 전체 요약
    const totalUnresolved = result.reduce((s, e) => s + e.unresolvedRepairCount, 0);
    const totalInProgress = result.reduce((s, e) => s + e.inProgressRepairCount, 0);
    const totalNeedsRepair = result.reduce((s, e) => s + e.needsRepairCount, 0);
    const pmIssueCount = result.filter(
      (e) => e.ventStatus !== "normal" || e.cleaningStatus !== "normal"
    ).length;

    return NextResponse.json(
      { equipments: result, totalUnresolved, totalInProgress, totalNeedsRepair, pmIssueCount }
    );
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: "대시보드 데이터 조회 실패" },
      { status: 500 }
    );
  }
}
