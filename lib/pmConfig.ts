// PM(예방 유지보수) 주기 설정 (단위: 일)
// 나중에 장비별 커스터마이징이 필요하면 DB로 이관

export const PM_CONFIG = {
  // Vent 권장 주기 (일)
  ventIntervalDays: 30,
  // 클리닝 권장 주기 (일)
  cleaningIntervalDays: 14,
  // 주의 단계 (권장 주기의 몇 % 초과 시)
  cautionThresholdPercent: 80,
} as const;

// PM 상태 판단
export type PmStatus = "normal" | "caution" | "overdue";

export function getPmStatus(
  lastDateStr: string | undefined,
  intervalDays: number
): PmStatus {
  if (intervalDays === 0) return "normal"; // 주기 0 = 스케줄 없음
  if (!lastDateStr) return "overdue"; // 기록 없으면 초과 처리
  const last = new Date(lastDateStr);
  const now = new Date();
  const elapsed = Math.floor(
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  );
  const cautionAt = Math.floor(
    intervalDays * (PM_CONFIG.cautionThresholdPercent / 100)
  );
  if (elapsed >= intervalDays) return "overdue";
  if (elapsed >= cautionAt) return "caution";
  return "normal";
}

export function getPmStatusLabel(status: PmStatus): string {
  switch (status) {
    case "overdue": return "점검 필요";
    case "caution": return "점검 임박";
    case "normal": return "정상";
  }
}

export function getPmStatusColor(status: PmStatus) {
  switch (status) {
    case "overdue": return { bg: "bg-red-100", text: "text-red-700" };
    case "caution": return { bg: "bg-yellow-100", text: "text-yellow-700" };
    case "normal": return { bg: "bg-green-100", text: "text-green-700" };
  }
}
