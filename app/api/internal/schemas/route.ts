import { NextResponse } from "next/server";
import { requireEquipReadAuth } from "@/lib/internal-auth";
import { OPERATION_SCHEMAS } from "@/lib/operation-schemas";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/internal/schemas — 장비 챗봇 작업 스키마 목록 반환.
// ventReason/cleaningType은 DB의 현재 옵션(label)을 enumValues로 동적 주입 → gemma가 목록에서 고른다.
export async function GET(request: Request) {
  const auth = requireEquipReadAuth(request);
  if (!auth.ok) return auth.response;

  // 현재 옵션 라벨을 DB에서 조회 (실패해도 스키마 자체는 반환)
  let ventLabels: string[] = [];
  let cleaningLabels: string[] = [];
  try {
    const [vents, cleans] = await Promise.all([
      prisma.ventReasonOption.findMany({ orderBy: { id: "asc" }, select: { label: true } }),
      prisma.cleaningTypeOption.findMany({ orderBy: { id: "asc" }, select: { label: true } }),
    ]);
    ventLabels = vents.map((v) => v.label);
    cleaningLabels = cleans.map((c) => c.label);
  } catch {
    // 옵션 조회 실패 시 enumValues 없이 진행 (gemma는 자유 입력)
  }

  // OPERATION_SCHEMAS 복사 후 해당 필드에 enumValues 주입 (원본 불변)
  const schemas = OPERATION_SCHEMAS.map((op) => ({
    ...op,
    fields: (op.fields ?? []).map((f) => {
      if (f.name === "ventReason" && ventLabels.length > 0) {
        return { ...f, enumValues: ventLabels };
      }
      if (f.name === "cleaningType" && cleaningLabels.length > 0) {
        return { ...f, enumValues: cleaningLabels };
      }
      return f;
    }),
  }));

  return NextResponse.json(schemas);
}
