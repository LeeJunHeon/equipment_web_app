import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// 포털 등 내부 시스템 → 장비 "쓰기" API 인증 (생성 전용).
// Authorization: Bearer <token> 가 process.env.EQUIP_WRITE_TOKEN 과 일치해야 통과.
// 조회용 EQUIP_MCP_TOKEN 과는 별개의 토큰(읽기/쓰기 권한 분리).
// 신원: x-acting-user-email 필수(감사용), x-acting-user-name 선택(작업자명).
// ⚠️ next-auth 세션 우회 안 함. 항상 머신 토큰 실검증.
export type EquipWriteAuthResult =
  | { ok: true; actingEmail: string; actingName: string }
  | { ok: false; response: NextResponse };

function safeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function requireEquipWriteAuth(request: Request): EquipWriteAuthResult {
  const expected = process.env.EQUIP_WRITE_TOKEN;
  if (!expected || expected.length === 0) {
    return { ok: false, response: NextResponse.json({ error: "EQUIP 쓰기 토큰 미설정" }, { status: 500 }) };
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1]?.trim() ?? "";
  if (!token || !safeStringEqual(token, expected)) {
    return { ok: false, response: NextResponse.json({ error: "인증 실패" }, { status: 401 }) };
  }

  const actingEmail = request.headers.get("x-acting-user-email")?.trim() || "";
  if (!actingEmail) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "행위자 이메일(x-acting-user-email)이 필요합니다." },
        { status: 401 }
      ),
    };
  }

  const headerName = request.headers.get("x-acting-user-name")?.trim() || "";
  const actingName = headerName || actingEmail.split("@")[0];

  return { ok: true, actingEmail, actingName };
}
