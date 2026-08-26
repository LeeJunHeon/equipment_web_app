// lib/downtime.ts
// 정지 구간(equipment_downtimes) 계산 헬퍼.
// 모든 시각은 KST 벽시계 규칙(lib/kst.ts)으로 만들어진 Date 여야 한다.

export interface DowntimeRange {
  startedAt: Date;
  endedAt: Date | null;   // null = 지금도 정지 중
}

/**
 * 정지 구간들을 [windowStart, now] 로 잘라내고 겹치는 구간을 병합해 총 정지 시간(ms)을 구한다.
 * 창 밖의 구간은 자동으로 걸러진다.
 */
export function mergedDowntimeMs(
  ranges: DowntimeRange[],
  windowStartMs: number,
  nowMs: number
): number {
  const clipped: [number, number][] = [];
  for (const r of ranges) {
    const startMs = Math.max(r.startedAt.getTime(), windowStartMs);
    const endMs = r.endedAt ? Math.min(r.endedAt.getTime(), nowMs) : nowMs;
    if (endMs > startMs) clipped.push([startMs, endMs]);
  }

  clipped.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of clipped) {
    if (merged.length && merged[merged.length - 1][1] >= s) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    } else {
      merged.push([s, e]);
    }
  }

  return merged.reduce((sum, [s, e]) => sum + (e - s), 0);
}

/** 열려 있는(아직 끝나지 않은) 구간을 찾는다. 없으면 undefined. */
export function findOpenDowntime<T extends { endedAt: Date | null }>(
  ranges: T[]
): T | undefined {
  return ranges.find((r) => r.endedAt === null);
}
