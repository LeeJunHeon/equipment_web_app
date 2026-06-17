import { NextResponse } from "next/server";
import { requireEquipReadAuth } from "@/lib/internal-auth";
import { OPERATION_SCHEMAS } from "@/lib/operation-schemas";

export const dynamic = "force-dynamic";

// GET /api/internal/schemas — 장비 챗봇 작업 스키마 목록 반환.
// 조회 토큰(EQUIP_MCP_TOKEN)으로 인증 — 포털이 스키마를 가져갈 때 사용.
export async function GET(request: Request) {
  const auth = requireEquipReadAuth(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json(OPERATION_SCHEMAS);
}
