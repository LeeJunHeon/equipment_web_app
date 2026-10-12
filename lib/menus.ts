// lib/menus.ts
// 장비관리 앱 메뉴의 단일 정의. 화면(app/page.tsx)의 딥링크 검증, 사이드바 문구,
// 포털 런처용 메뉴 목록 API(/api/portal-menus)가 모두 여기를 본다.
// 키(page)는 화면 상태 currentPage 값이자 포털과 맞춘 공통 계약이므로 함부로 바꾸지 말 것.
// 서버·클라이언트 양쪽에서 import 하므로 window·prisma 등에 의존하지 않는다.

/** 화면 상태(currentPage) 키 */
export type PageKey =
  | "dashboard"
  | "equipment"
  | "equipment-settings"
  | "history-repair"
  | "history-vent"
  | "history-cleaning";

/** 장비 상세(id 가 붙는 동적 메뉴)를 뺀 고정 메뉴 키 */
export type StaticPageKey = Exclude<PageKey, "equipment">;

/** 포털 런처가 그릴 수 있는 아이콘 이름 (포털과 맞춘 목록. 여기 없는 이름은 쓰지 않는다) */
export type PortalIcon =
  | "Home" | "Package" | "BarChart3" | "Clock" | "QrCode" | "Search" | "Layers" | "Target"
  | "Droplet" | "Building2" | "Users" | "FileText" | "Wrench" | "Wind" | "Sparkles" | "Settings"
  | "Cpu" | "Calendar" | "Plane" | "CheckSquare" | "CalendarDays" | "CalendarCheck" | "Smartphone"
  | "Award" | "IdCard" | "LayoutDashboard" | "ListChecks" | "ClipboardList" | "History" | "Gauge";

export interface StaticMenuDef {
  label: string;
  icon: PortalIcon;
  adminOnly: boolean;
}

export const DEFAULT_PAGE: PageKey = "dashboard";

/** 고정 메뉴 정의 */
export const STATIC_MENUS: Record<StaticPageKey, StaticMenuDef> = {
  dashboard: { label: "대시보드", icon: "Home", adminOnly: false },
  "history-repair": { label: "수리 이력", icon: "Wrench", adminOnly: false },
  "history-vent": { label: "Vent 이력", icon: "Wind", adminOnly: false },
  "history-cleaning": { label: "클리닝 이력", icon: "Sparkles", adminOnly: false },
  "equipment-settings": { label: "장비 설정", icon: "Settings", adminOnly: true },
};

/** 장비 상세 메뉴의 아이콘 (라벨은 장비 이름) */
export const EQUIPMENT_MENU_ICON: PortalIcon = "Cpu";

/** 사이드바에 보이는 순서. "equipment" 자리에 활성 장비가 id 오름차순으로 펼쳐진다. */
export const SIDEBAR_ORDER: readonly PageKey[] = [
  "dashboard",
  "history-repair",
  "history-vent",
  "history-cleaning",
  "equipment",
  "equipment-settings",
];

/** 문자열이 알려진 화면 키인지 (딥링크의 모르는 키를 걸러내는 용도) */
export function isPageKey(v: unknown): v is PageKey {
  return typeof v === "string" && (SIDEBAR_ORDER as readonly string[]).includes(v);
}

/** 이 사용자가 그 화면을 볼 수 있는가. 사이드바 노출·딥링크·메뉴 API 가 같은 규칙을 쓴다. */
export function canAccessPage(page: PageKey, isAdmin: boolean): boolean {
  if (page === "equipment") return true;
  return !STATIC_MENUS[page].adminOnly || isAdmin;
}
