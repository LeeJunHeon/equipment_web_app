import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth-utils";
import { nowKst, parseKst } from "@/lib/kst";
import { isRepairStatus } from "@/lib/repairStatus";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get("equipmentId");
    const eventType = searchParams.get("eventType");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (equipmentId) where.equipmentId = Number(equipmentId);
    if (eventType) where.eventType = eventType;
    if (status) where.status = status;

    const logs = await prisma.equipmentLog.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      include: {
        equipment: { select: { name: true } },
        photos: { select: { id: true, fileName: true, fileSize: true }, orderBy: { createdAt: "asc" } },
      },
    });

    const result = logs.map((log) => ({
      ...log,
      equipmentName: log.equipment.name,
      equipment: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/logs error:", error);
    return NextResponse.json(
      { error: "이력 조회 실패" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      equipmentId, eventType, occurredAt, operator, description,
      status, completedAt,
      symptom, replacedParts, isExternal, vendorName,
      ventReason,
      cleaningType, nextScheduledAt,
    } = body;

    if (!equipmentId || !eventType || !occurredAt || !operator) {
      return NextResponse.json(
        { error: "equipmentId, eventType, occurredAt, operator는 필수입니다." },
        { status: 400 },
      );
    }

    const parsedOccurredAt = parseKst(occurredAt);
    if (isNaN(parsedOccurredAt.getTime())) {
      return NextResponse.json({ error: "유효한 발생일시가 아닙니다." }, { status: 400 });
    }

    const isRepair = eventType === "repair";
    // 수리가 아닌 이벤트(vent/cleaning)는 순간 이벤트이므로 항상 "완료".
    const finalStatus = isRepair
      ? (isRepairStatus(status) ? status : "처리중")
      : "완료";

    // repair_started_at: "실제로 장비를 세운 시각".
    // 신규 등록 시 처리중/완료는 발생 시점에 세운 것으로 간주하고,
    // 수리필요는 아직 세우지 않았으므로 null.
    const repairStartedAt =
      isRepair && finalStatus !== "수리필요" ? parsedOccurredAt : null;

    const log = await prisma.equipmentLog.create({
      data: {
        equipmentId: Number(equipmentId),
        eventType,
        occurredAt: parsedOccurredAt,
        operator,
        description: description || null,
        status: finalStatus,
        repairStartedAt,
        // completed_at은 수리(repair) 전용. vent/cleaning은 시작~종료 구간이 없는
        // 순간 이벤트라 occurred_at 하나로 충분하므로 항상 null.
        completedAt:
          isRepair && finalStatus === "완료"
            ? (completedAt ? parseKst(completedAt) : nowKst())
            : null,
        symptom: symptom || null,
        replacedParts: replacedParts || null,
        isExternal: isExternal ?? false,
        vendorName: vendorName || null,
        ventReason: ventReason || null,
        cleaningType: cleaningType || null,
        nextScheduledAt: nextScheduledAt ? new Date(nextScheduledAt) : null,
      },
      include: {
        equipment: { select: { name: true } },
        photos: { select: { id: true, fileName: true, fileSize: true }, orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json(
      { ...log, equipmentName: log.equipment.name, equipment: undefined },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/logs error:", error);
    return NextResponse.json({ error: "이력 등록 실패" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // status 단일 변경(수리 시작 / 완료처리 등)은 모두 허용, 그 외 수정은 admin만.
    const bodyForCheck = await request.clone().json().catch(() => ({}));
    const isOnlyStatusChange =
      Object.keys(bodyForCheck).filter((k) => k !== "id").length === 1 &&
      isRepairStatus(bodyForCheck.status);

    if (!isOnlyStatusChange && !(await isAdmin())) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "이력 ID는 필수입니다." }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (updateData.status !== undefined) {
      if (!isRepairStatus(updateData.status)) {
        return NextResponse.json({ error: "유효한 상태가 아닙니다." }, { status: 400 });
      }
      data.status = updateData.status;

      const current = await prisma.equipmentLog.findUnique({
        where: { id },
        select: { repairStartedAt: true },
      });
      if (!current) {
        return NextResponse.json({ error: "이력을 찾을 수 없습니다." }, { status: 404 });
      }

      if (updateData.status === "수리필요") {
        // 되돌리기: 아직 세운 적 없는 상태로 초기화 → 비가동 0
        data.repairStartedAt = null;
        data.completedAt = null;
      } else if (updateData.status === "처리중") {
        // 수리 시작. 이미 세운 기록이 있으면 유지, 없으면 지금부터 정지로 본다.
        data.repairStartedAt =
          current.repairStartedAt ??
          (updateData.repairStartedAt ? parseKst(updateData.repairStartedAt) : nowKst());
        data.completedAt = null;
      } else {
        // 완료. repairStartedAt이 null이면(수리필요 → 완료 직행)
        // 장비를 세운 적이 없다는 뜻이므로 null 그대로 두어 비가동 0을 유지한다.
        data.completedAt = updateData.completedAt
          ? parseKst(updateData.completedAt)
          : nowKst();
      }
    } else {
      if (updateData.completedAt !== undefined) {
        data.completedAt = updateData.completedAt ? parseKst(updateData.completedAt) : null;
      }
      if (updateData.repairStartedAt !== undefined) {
        data.repairStartedAt = updateData.repairStartedAt
          ? parseKst(updateData.repairStartedAt)
          : null;
      }
    }
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.operator !== undefined) data.operator = updateData.operator;
    if (updateData.occurredAt !== undefined) data.occurredAt = parseKst(updateData.occurredAt);
    if (updateData.symptom !== undefined) data.symptom = updateData.symptom;
    if (updateData.replacedParts !== undefined) data.replacedParts = updateData.replacedParts;
    if (updateData.isExternal !== undefined) data.isExternal = updateData.isExternal;
    if (updateData.vendorName !== undefined) data.vendorName = updateData.vendorName;
    if (updateData.ventReason !== undefined) data.ventReason = updateData.ventReason;
    if (updateData.cleaningType !== undefined) data.cleaningType = updateData.cleaningType;
    if (updateData.nextScheduledAt !== undefined) data.nextScheduledAt = updateData.nextScheduledAt ? new Date(updateData.nextScheduledAt) : null;

    const log = await prisma.equipmentLog.update({
      where: { id },
      data,
      include: {
        equipment: { select: { name: true } },
        photos: { select: { id: true, fileName: true, fileSize: true }, orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({ ...log, equipmentName: log.equipment.name, equipment: undefined });
  } catch (error) {
    console.error("PATCH /api/logs error:", error);
    return NextResponse.json({ error: "이력 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "이력 ID는 필수입니다." }, { status: 400 });
    }

    await prisma.equipmentLog.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/logs error:", error);
    return NextResponse.json({ error: "이력 삭제 실패" }, { status: 500 });
  }
}
