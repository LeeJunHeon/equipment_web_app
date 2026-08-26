// lib/repairStatus.ts
// 수리(repair) 이벤트 상태의 단일 진실 공급원.
//
// 상태 축은 "장비가 지금 돌고 있는가" 하나로 통일한다.
// - 가동중: 수리가 필요하지만 장비는 계속 돌고 있다 → 가동률에 영향 없음
// - 정지중: 장비를 세우고 수리 중이다              → 비가동 시간 누적
// - 완료  : 수리 종료
// vent/cleaning은 시작~종료 구간이 없는 순간 이벤트라 항상 "완료"만 쓴다.
//
// 주의: 아래 값은 DB(equipment_logs.status)에 그대로 저장된다.
// 값을 바꾸면 마이그레이션이 필요하므로 함부로 수정하지 말 것.
// 코드에서는 문자열 리터럴 대신 반드시 REPAIR_STATUS 상수를 참조한다.

export const REPAIR_STATUS = {
  /** 수리 필요하지만 장비는 가동 중 */
  RUNNING: "가동중",
  /** 장비를 세우고 수리 중 */
  STOPPED: "정지중",
  /** 수리 종료 */
  DONE: "완료",
} as const;

export const REPAIR_STATUSES = [
  REPAIR_STATUS.RUNNING,
  REPAIR_STATUS.STOPPED,
  REPAIR_STATUS.DONE,
] as const;

export type RepairStatus = (typeof REPAIR_STATUSES)[number];

export function isRepairStatus(v: unknown): v is RepairStatus {
  return typeof v === "string" && (REPAIR_STATUSES as readonly string[]).includes(v);
}

/** 미완료 여부 (가동중 + 정지중). 알림·뱃지 집계용. */
export function isOpenRepair(status: string): boolean {
  return status === REPAIR_STATUS.RUNNING || status === REPAIR_STATUS.STOPPED;
}

/** 장비가 실제로 서 있는 상태인가. */
export function isDowntimeStatus(status: string): boolean {
  return status === REPAIR_STATUS.STOPPED;
}

/** 화면 표시용 전체 라벨. 괄호로 수리 관점을 덧붙인다. */
export function repairStatusLabel(status: string): string {
  if (status === REPAIR_STATUS.RUNNING) return "가동 중 (수리 필요)";
  if (status === REPAIR_STATUS.STOPPED) return "정지 중 (수리 중)";
  if (status === REPAIR_STATUS.DONE) return "완료";
  return status;   // 알 수 없는 값은 그대로 노출해 이상을 드러낸다
}

/** 공간이 좁은 곳(필터 버튼 등)용 짧은 라벨. */
export function repairStatusShortLabel(status: string): string {
  if (status === REPAIR_STATUS.RUNNING) return "가동 중";
  if (status === REPAIR_STATUS.STOPPED) return "정지 중";
  if (status === REPAIR_STATUS.DONE) return "완료";
  return status;
}

/** 뱃지 배경+글자 Tailwind 클래스 */
export function repairStatusBadgeClass(status: string): string {
  if (status === REPAIR_STATUS.RUNNING) return "bg-amber-100 text-amber-700";
  if (status === REPAIR_STATUS.STOPPED) return "bg-red-100 text-red-700";
  return "bg-green-100 text-green-700";
}

/** 강조 텍스트 색상 (섹션 헤더 등) */
export function repairStatusTextClass(status: string): string {
  if (status === REPAIR_STATUS.RUNNING) return "text-amber-600";
  if (status === REPAIR_STATUS.STOPPED) return "text-red-500";
  return "text-gray-400";
}
