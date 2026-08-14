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

/**
 * 다양한 형식의 일시 문자열을 DB 저장용 Date(KST 벽시계 규칙)로 변환한다.
 * - "2026-08-11T10:34" / "2026-08-11 10:34:00"  → KST 벽시계로 간주
 * - "2026-08-11"                                → 해당 날짜 KST 00:00
 * - "...Z" / "...+09:00" 등 타임존이 붙은 경우   → 절대시각으로 파싱 후 KST 벽시계로 환산
 * 파싱 실패 시 Invalid Date를 반환하므로 호출부에서 isNaN(d.getTime())으로 검증할 것.
 */
export function parseKst(input: string): Date {
  const s = String(input ?? "").trim();
  if (!s) return new Date(NaN);

  // 타임존이 명시된 문자열은 절대시각 → KST 벽시계로 환산
  if (/(?:[Zz]|[+-]\d{2}:?\d{2})$/.test(s)) {
    const abs = new Date(s);
    return isNaN(abs.getTime()) ? abs : new Date(abs.getTime() + 9 * 60 * 60 * 1000);
  }

  const t = s.replace(" ", "T");
  // 날짜만 → 00:00 보정
  const withTime = /^\d{4}-\d{2}-\d{2}$/.test(t) ? `${t}T00:00:00` : t;
  // 초 누락 → :00 보정
  const withSec = /T\d{2}:\d{2}$/.test(withTime) ? `${withTime}:00` : withTime;
  return new Date(`${withSec}Z`);
}

/** 이번 달 1일 00:00 (KST 벽시계) Date */
export function monthStartKst(): Date {
  const k = nowKst();
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), 1, 0, 0, 0, 0));
}
