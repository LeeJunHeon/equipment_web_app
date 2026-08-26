// lib/repairStatus.ts
// 수리(repair) 이벤트 상태의 단일 진실 공급원.
// - 수리필요: 이상은 발견됐지만 장비는 계속 가동 중  → 가동률에 영향 없음
// - 처리중  : 장비를 세우고 수리 진행 중              → 비가동 시간 누적
// - 완료    : 수리 종료
// vent/cleaning은 시작~종료 구간이 없는 순간 이벤트라 항상 "완료"만 쓴다.

export const REPAIR_STATUSES = ["수리필요", "처리중", "완료"] as const;
export type RepairStatus = (typeof REPAIR_STATUSES)[number];

export function isRepairStatus(v: unknown): v is RepairStatus {
  return typeof v === "string" && (REPAIR_STATUSES as readonly string[]).includes(v);
}

/** 미완료 여부 (수리필요 + 처리중). 알림·뱃지 집계용. */
export function isOpenRepair(status: string): boolean {
  return status === "수리필요" || status === "처리중";
}

/** 장비가 실제로 서 있는 상태인가. 가동률 차감 대상 판정용. */
export function isDowntimeStatus(status: string): boolean {
  return status === "처리중";
}

/** 뱃지 배경+글자 Tailwind 클래스 */
export function repairStatusBadgeClass(status: string): string {
  if (status === "수리필요") return "bg-amber-100 text-amber-700";
  if (status === "처리중") return "bg-red-100 text-red-700";
  return "bg-green-100 text-green-700";
}

/** 강조 텍스트 색상 (섹션 헤더 등) */
export function repairStatusTextClass(status: string): string {
  if (status === "수리필요") return "text-amber-600";
  if (status === "처리중") return "text-red-500";
  return "text-gray-400";
}
