// lib/portalLogs.ts
// 포털 활동 로그(/api/portal-logs)용 순수 계산. prisma·window 에 의존하지 않는다.

import type { PageKey } from "@/lib/menus";
import type { EventType } from "@/lib/types";

export const PORTAL_LOGS_DEFAULT_LIMIT = 10;
export const PORTAL_LOGS_MAX_LIMIT = 20;

/** 이벤트별로 포털에서 바로 열 화면. 화면 키가 바뀌면 여기서 타입 에러가 난다. */
const EVENT_PAGE: Record<EventType, PageKey> = {
  repair: "history-repair",
  vent: "history-vent",
  cleaning: "history-cleaning",
};

/** 이벤트 종류 → 화면 키. 모르는 종류는 undefined(포털은 앱 첫 화면으로 연다). */
export function eventTypePage(eventType: string): PageKey | undefined {
  return Object.hasOwn(EVENT_PAGE, eventType) ? EVENT_PAGE[eventType as EventType] : undefined;
}

/** ?limit= → 1~20 정수. 없거나 숫자가 아니면 기본 10. */
export function parsePortalLogsLimit(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return PORTAL_LOGS_DEFAULT_LIMIT;
  return Math.min(PORTAL_LOGS_MAX_LIMIT, Math.max(1, n));
}
