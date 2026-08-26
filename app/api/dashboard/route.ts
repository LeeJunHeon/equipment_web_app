import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPmStatus } from "@/lib/pmConfig";
import { nowKst, monthStartKst } from "@/lib/kst";

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
            repairStartedAt: true,
            completedAt: true,
          },
        },
      },
    });

    const result = equipments.map((eq) => {
      const repairLogs = eq.logs.filter((l) => l.eventType === "repair");
      const ventLogs = eq.logs.filter((l) => l.eventType === "vent");
      const cleaningLogs = eq.logs.filter((l) => l.eventType === "cleaning");

      // 미해결 = 수리필요 + 처리중. 뱃지·정렬은 처리중을 우선한다.
      const inProgressRepairs = repairLogs.filter((l) => l.status === "처리중");
      const needsRepairs = repairLogs.filter((l) => l.status === "수리필요");
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

      // 비가동 계산은 "실제로 장비를 세운 시각"(repairStartedAt) 기준이다.
      // repairStartedAt이 null이면 장비를 세운 적이 없다는 뜻(수리필요 상태이거나
      // 수리필요 → 완료 직행)이므로 비가동에 전혀 반영하지 않는다.
      const relevantRepairs = repairLogs.filter((r) => {
        if (!r.repairStartedAt) return false;
        if (r.status === "수리필요") return false;      // 가동 중 → 비가동 아님
        if (r.status === "처리중") return true;         // 지금도 정지 중
        if (!r.completedAt) return false;
        return r.completedAt.getTime() >= monthStartMs; // 이번 달에 걸친 완료 건만
      });

      // 각 수리의 비가동 구간 [startMs, endMs] 계산
      const ranges: [number, number][] = [];
      for (const repair of relevantRepairs) {
        const startedMs = repair.repairStartedAt!.getTime();
        const startMs = Math.max(startedMs, monthStartMs);
        let endMs: number;

        if (repair.status === "처리중") {
          endMs = nowMs;
        } else if (repair.completedAt) {
          endMs = Math.min(repair.completedAt.getTime(), nowMs);
        } else {
          continue;
        }

        if (endMs > startMs) {
          ranges.push([startMs, endMs]);
        }
      }

      // 겹치는 구간 병합 (이중 계산 방지)
      ranges.sort((a, b) => a[0] - b[0]);
      const merged: [number, number][] = [];
      for (const [s, e] of ranges) {
        if (merged.length && merged[merged.length - 1][1] >= s) {
          merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
        } else {
          merged.push([s, e]);
        }
      }

      // ms 단위로 비가동 시간 계산 → 가동률(%), 비가동 시간(시간 단위)
      const downtimeMs = merged.reduce((sum, [s, e]) => sum + (e - s), 0);
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
