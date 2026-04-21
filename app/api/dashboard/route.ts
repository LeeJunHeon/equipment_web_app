import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPmStatus } from "@/lib/pmConfig";

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
            completedAt: true,
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
      const ventStatus = getPmStatus(lastVentDate, eq.ventIntervalDays);
      const cleaningStatus = eq.isCleaningTarget === false
        ? "normal"
        : getPmStatus(lastCleaningDate, eq.cleaningIntervalDays);

      // 이번 달 기준 시간(ms)
      const monthDays = now.getDate();
      const monthTotalMs = monthDays * 24 * 60 * 60 * 1000;
      const monthStartMs = thisMonthStart.getTime();
      const nowMs = now.getTime();

      // 이번 달에 영향을 주는 수리만 필터
      // - 처리중: 시작 시점 무관하게 포함 (지금도 비가동 중)
      // - 완료: completedAt이 이번 달 이후인 것만 포함
      const relevantRepairs = repairLogs.filter((r) => {
        if (r.status === "처리중") return true;
        if (!r.completedAt) return false;
        return r.completedAt.getTime() >= monthStartMs;
      });

      // 각 수리의 비가동 구간 [startMs, endMs] 계산
      const ranges: [number, number][] = [];
      for (const repair of relevantRepairs) {
        const startMs = Math.max(repair.occurredAt.getTime(), monthStartMs);
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
        downtimeHours,
        ventIntervalDays: eq.ventIntervalDays,
        cleaningIntervalDays: eq.cleaningIntervalDays,
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
