import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEquipWriteAuth } from "@/lib/internal-write-auth";

export const dynamic = "force-dynamic";

const VALID_EVENT_TYPES = ["repair", "vent", "cleaning"];

// VarChar 컬럼 길이에 맞게 자르는 헬퍼(초과 입력으로 인한 오류 방지). 빈값/비문자열은 null.
function cap(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t.slice(0, max);
}

// 자유 텍스트(Text 컬럼, 길이 제한 없음). 빈값/비문자열은 null.
function text(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

// POST /api/internal/equipment-log
// 챗봇(포털)용 장비 이력 "생성" 전용. app/api/logs POST 생성 로직을 복제하되
// 토큰(EQUIP_WRITE_TOKEN) + 행위자 헤더로 인증. operator는 헤더 신원에서 채움(body 값 무시 → 위조 방지).
// 사진/일일기록(entries)은 v1 범위 밖.
export async function POST(request: Request) {
  const auth = requireEquipWriteAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();

    // 장비 식별: equipmentId(숫자) 우선, 없으면 equipmentName으로 조회
    let equipmentId: number | null = null;
    if (body.equipmentId !== null && body.equipmentId !== undefined && body.equipmentId !== "") {
      const asNum = Number(body.equipmentId);
      equipmentId = Number.isNaN(asNum) ? null : asNum;
    }
    if (equipmentId === null && body.equipmentName) {
      const eq = await prisma.equipment.findFirst({
        where: { name: { contains: String(body.equipmentName), mode: "insensitive" }, isActive: true },
        select: { id: true },
      });
      if (!eq) {
        return NextResponse.json(
          { error: `장비 '${body.equipmentName}'를 찾을 수 없습니다.` },
          { status: 400 }
        );
      }
      equipmentId = eq.id;
    }
    if (equipmentId === null) {
      return NextResponse.json(
        { error: "장비(equipmentId 또는 equipmentName)가 필요합니다." },
        { status: 400 }
      );
    }

    // 이벤트 종류
    const eventType = String(body.eventType ?? "");
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json(
        { error: "eventType은 repair/vent/cleaning 중 하나여야 합니다." },
        { status: 400 }
      );
    }

    // 발생일시: 미입력 시 현재시각 (특정 날짜의 KST 처리는 포털 연결 단계에서 정교화)
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
    if (isNaN(occurredAt.getTime())) {
      return NextResponse.json({ error: "유효한 발생일시가 아닙니다." }, { status: 400 });
    }

    const isRepair = eventType === "repair";
    const isVent = eventType === "vent";
    const isCleaning = eventType === "cleaning";

    // 상태 기본값: vent/cleaning은 완료, repair는 body값(없으면 처리중)
    const status = isRepair ? (body.status === "완료" ? "완료" : "처리중") : "완료";
    const isExternal = isRepair && (body.isExternal === true || body.isExternal === "외부업체");

    const log = await prisma.equipmentLog.create({
      data: {
        equipmentId,
        eventType,
        occurredAt,
        operator: auth.actingName.slice(0, 50), // 헤더 신원에서 (body 값 무시)
        description: text(body.description),
        status,
        symptom: isRepair ? text(body.symptom) : null,
        replacedParts: isRepair ? text(body.replacedParts) : null,
        isExternal,
        vendorName: isExternal ? cap(body.vendorName, 100) : null,
        ventReason: isVent ? cap(body.ventReason, 50) : null,
        cleaningType: isCleaning ? cap(body.cleaningType, 50) : null,
        nextScheduledAt: isCleaning && body.nextScheduledAt ? new Date(body.nextScheduledAt) : null,
      },
      include: { equipment: { select: { name: true } } },
    });

    return NextResponse.json(
      {
        ok: true,
        id: log.id,
        equipmentName: log.equipment?.name ?? null,
        eventType: log.eventType,
        status: log.status,
        operator: log.operator,
        occurredAt: log.occurredAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/internal/equipment-log error:", error);
    return NextResponse.json({ error: "장비 이력 생성 실패" }, { status: 500 });
  }
}
