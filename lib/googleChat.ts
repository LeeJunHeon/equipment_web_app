// lib/googleChat.ts
// 구글챗 수신 웹훅(incoming webhook)으로 텍스트 메시지를 보내는 최소 발송기.
// 주의: 웹훅 URL 쿼리에 key·token 이 들어 있어 URL 자체가 비밀이다.
// 에러 메시지·로그에 URL 을 절대 넣지 않는다.

const TIMEOUT_MS = 5000;
// 구글챗 웹훅은 스페이스당 초당 1건 제한이 있어 동시 등록 시 429 가 날 수 있다.
// 제한 창(1초)이 지나도록 조금 여유를 두고 한 번만 다시 보낸다.
const RETRY_DELAY_MS = 1500;

/** 웹훅으로 1회 POST. 시도마다 새 타임아웃을 걸어 재시도가 앞 시도의 시간에 묶이지 않게 한다. */
function postOnce(webhookUrl: string, text: string): Promise<Response> {
  return fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/**
 * 구글챗 스페이스에 텍스트 메시지를 보낸다.
 * HTTP 429 면 1.5초 뒤 1회만 재시도하고, 그래도 실패하면 throw 한다.
 * @param webhookUrl 스페이스 웹훅 URL (비밀값 — 로그·에러에 노출 금지)
 * @param text 구글챗 텍스트 문법(*굵게* 등)의 메시지 본문
 * @throws Error 응답이 2xx 가 아니거나 네트워크·타임아웃 오류일 때
 */
export async function sendGoogleChatText(webhookUrl: string, text: string): Promise<void> {
  let res = await postOnce(webhookUrl, text);
  if (res.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    res = await postOnce(webhookUrl, text);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`구글챗 전송 실패 (HTTP ${res.status}): ${body.slice(0, 200)}`);
  }
}
