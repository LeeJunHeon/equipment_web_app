// lib/kst.ts
// 규칙: occurred_at, completed_at 은 "KST 벽시계"를 timezone 없는 timestamp에 저장한다.
// Prisma는 naive timestamp를 UTC로 해석해 Date를 만들므로, 여기서 나온 Date의
// getTime()은 절대시각이 아니라 "KST 벽시계를 UTC로 읽은 값"이다.
// 같은 규칙으로 만든 값끼리만 비교·뺄셈해야 한다.
// 아래 함수들은 모두 컨테이너 TZ 설정과 무관하게 동작한다.

/** 현재 시각을 KST 벽시계 기준 Date로 반환 (DB 저장용) */
export function nowKst(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

/** "YYYY-MM-DDTHH:mm" 또는 "YYYY-MM-DD HH:mm:ss" (KST 벽시계) → DB 저장용 Date */
export function parseKst(input: string): Date {
  const s = input.trim().replace(" ", "T");
  const withSec = s.length === 16 ? `${s}:00` : s;
  return new Date(`${withSec}Z`);
}

/** 이번 달 1일 00:00 (KST 벽시계) Date */
export function monthStartKst(): Date {
  const k = nowKst();
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), 1, 0, 0, 0, 0));
}
