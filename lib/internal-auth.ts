import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// MCP 서버 등 내부 시스템 → 장비 조회 API 인증 (읽기 전용).
// Authorization: Bearer <token> 가 process.env.EQUIP_MCP_TOKEN 과 일치해야 통과.
// ⚠️ next-auth 세션 우회 안 함. 항상 머신 토큰 실검증. 조회 전용 엔드포인트에만 사용.
export type EquipReadAuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

function safeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function requireEquipReadAuth(request: Request): EquipReadAuthResult {
  const expected = process.env.EQUIP_MCP_TOKEN;
  if (!expected || expected.length === 0) {
    return {
      ok: false,
      response: NextResponse.json({ error: "EQUIP MCP 토큰 미설정" }, { status: 500 }),
    };
  }
  const authHeader = request.headers.get("authorization") ?? "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1]?.trim() ?? "";
  if (!token || !safeStringEqual(token, expected)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "인증 실패" }, { status: 401 }),
    };
  }
  return { ok: true };
}
