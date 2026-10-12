// lib/launcher.ts
// 포털 런처 연동용 브라우저 헬퍼: 주소(?page=·&id=) 읽기·쓰기와 사용 기록 전송.
// window 를 쓰므로 반드시 useEffect·이벤트 핸들러 안에서만 호출한다(서버 렌더·hydration 불일치 방지).

import { DEFAULT_PAGE, isPageKey, type PageKey } from "@/lib/menus";

const APP_KEY = "equipment";

export interface PageLink {
  page: PageKey;
  /** page 가 "equipment" 일 때만 장비 id */
  id: number | null;
}

/**
 * 현재 주소의 ?page=·&id= 를 읽는다.
 * 모르는 키·기본 화면·id 없는 장비 상세는 null(= 기본 화면 그대로).
 * 권한 판단은 하지 않으므로 호출부에서 canAccessPage 로 확인한다.
 */
export function readPageLink(): PageLink | null {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");
  if (!isPageKey(page) || page === DEFAULT_PAGE) return null;
  if (page !== "equipment") return { page, id: null };

  const id = Number(params.get("id"));
  return Number.isInteger(id) && id > 0 ? { page, id } : null;
}

/**
 * 주소의 page·id 를 현재 화면과 맞춘다. 기본 화면이면 둘 다 지운다.
 * 다른 쿼리 파라미터는 그대로 두고, 뒤로가기 동작을 바꾸지 않도록 replaceState 만 쓴다.
 */
export function writePageLink(page: PageKey, id: number | null): void {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  if (page === DEFAULT_PAGE) {
    params.delete("page");
  } else {
    params.set("page", page);
  }
  if (page === "equipment" && id !== null) {
    params.set("id", String(id));
  } else {
    params.delete("id");
  }
  if (url.href !== window.location.href) {
    // Next 앱 라우터는 history.state 를 자체 관리하므로 문서 예시대로 null 을 넘긴다.
    window.history.replaceState(null, "", url.href);
  }
}

/**
 * 사용자가 직접 메뉴를 옮겼을 때 포털에 사용 기록 1건을 보낸다. 실패는 조용히 무시한다.
 * BasePathFetch 가 "/" 로 시작하는 주소에 basePath(/equipment)를 붙이므로
 * 포털 API 로 가려면 origin 을 붙인 절대 주소를 써야 한다.
 */
export function sendLauncherUsage(page: PageKey, id: number | null): void {
  try {
    const url = `${window.location.origin}/api/launcher/usage`;
    const body = JSON.stringify(
      page === "equipment" && id !== null ? { app: APP_KEY, page, id } : { app: APP_KEY, page },
    );
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }
    fetch(url, {
      method: "POST",
      keepalive: true,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {});
  } catch {
    // 기록은 부가 기능이라 화면 동작에 영향을 주지 않는다.
  }
}
