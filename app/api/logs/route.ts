import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma";
import { isAdmin } from "@/lib/auth-utils";
import { nowKst, parseKst } from "@/lib/kst";
import { isRepairStatus } from "@/lib/repairStatus";
import { findOpenDowntime } from "@/lib/downtime";

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
        downtimes: {
          select: { id: true, startedAt: true, endedAt: true },
          orderBy: { startedAt: "asc" },
        },
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

    const parsedCompletedAt =
      isRepair && finalStatus === "완료"
        ? (completedAt ? parseKst(completedAt) : nowKst())
        : null;

    // 등록 시점의 정지 구간.
    // - 수리필요: 아직 세운 적 없음 → 구간 없음
    // - 처리중  : 발생 시점부터 정지 중 → 열린 구간 1개
    // - 완료    : 발생 시점부터 완료 시점까지 정지했던 것으로 본다 → 닫힌 구간 1개
    const initialDowntimes =
      isRepair && finalStatus !== "수리필요"
        ? [{ startedAt: parsedOccurredAt, endedAt: parsedCompletedAt }]
        : [];

    const log = await prisma.equipmentLog.create({
      data: {
        equipmentId: Number(equipmentId),
        eventType,
        occurredAt: parsedOccurredAt,
        operator,
        description: description || null,
        status: finalStatus,
        // completed_at은 수리(repair) 전용. vent/cleaning은 시작~종료 구간이 없는
        // 순간 이벤트라 occurred_at 하나로 충분하므로 항상 null.
        completedAt: parsedCompletedAt,
        ...(initialDowntimes.length > 0
          ? { downtimes: { create: initialDowntimes } }
          : {}),
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
        downtimes: {
          select: { id: true, startedAt: true, endedAt: true },
          orderBy: { startedAt: "asc" },
        },
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
    // 정지 구간 변경은 아래 로그 update 와 한 트랜잭션으로 함께 커밋한다.
    const pendingOps: Prisma.PrismaPromise<unknown>[] = [];

    if (updateData.status !== undefined) {
      if (!isRepairStatus(updateData.status)) {
        return NextResponse.json({ error: "유효한 상태가 아닙니다." }, { status: 400 });
      }

      const current = await prisma.equipmentLog.findUnique({
        where: { id },
        select: {
          eventType: true,
          downtimes: { select: { id: true, startedAt: true, endedAt: true } },
        },
      });
      if (!current) {
        return NextResponse.json({ error: "이력을 찾을 수 없습니다." }, { status: 404 });
      }
      // vent/cleaning 은 시작~종료 구간이 없는 순간 이벤트라 항상 "완료"만 허용한다.
      if (current.eventType !== "repair" && updateData.status !== "완료") {
        return NextResponse.json(
          { error: "수리 이력만 상태를 변경할 수 있습니다." },
          { status: 400 }
        );
      }

      data.status = updateData.status;
      const open = findOpenDowntime(current.downtimes);
      const now = nowKst();

      // 정지 구간은 절대 삭제하지 않는다. 닫거나(ended_at 설정) 새로 연다(행 추가).
      if (updateData.status === "수리필요") {
        // 장비를 다시 돌리는 것 → 열린 구간이 있으면 지금 시점으로 닫는다.
        // 이전에 세웠던 구간은 그대로 보존된다.
        data.completedAt = null;
        if (open) {
          pendingOps.push(
            prisma.equipmentDowntime.update({
              where: { id: open.id },
              data: { endedAt: now },
            })
          );
        }
      } else if (updateData.status === "처리중") {
        // 수리 시작 → 열린 구간이 없으면 새로 연다. 이미 열려 있으면 그대로 둔다.
        data.completedAt = null;
        if (!open) {
          pendingOps.push(
            prisma.equipmentDowntime.create({
              data: { logId: id, startedAt: now, endedAt: null },
            })
          );
        }
      } else {
        // 완료 → 열린 구간이 있으면 완료 시각으로 닫는다.
        // 열린 구간이 없으면(수리필요에서 바로 완료) 새 구간을 만들지 않는다.
        // 과거에 닫힌 구간이 있으면 그대로 남아 비가동에 계속 반영된다.
        const completedAtValue = updateData.completedAt
          ? parseKst(updateData.completedAt)
          : now;
        data.completedAt = completedAtValue;
        if (open) {
          // 완료 시각이 시작보다 이르면 데이터가 뒤집히므로 시작 시각으로 보정한다.
          const endValue =
            completedAtValue.getTime() < open.startedAt.getTime()
              ? open.startedAt
              : completedAtValue;
          pendingOps.push(
            prisma.equipmentDowntime.update({
              where: { id: open.id },
              data: { endedAt: endValue },
            })
          );
        }
      }
    } else if (updateData.completedAt !== undefined) {
      data.completedAt = updateData.completedAt ? parseKst(updateData.completedAt) : null;
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

    const logUpdate = prisma.equipmentLog.update({
      where: { id },
      data,
      include: {
        equipment: { select: { name: true } },
        photos: { select: { id: true, fileName: true, fileSize: true }, orderBy: { createdAt: "asc" } },
        downtimes: {
          select: { id: true, startedAt: true, endedAt: true },
          orderBy: { startedAt: "asc" },
        },
      },
    });

    const results = await prisma.$transaction([...pendingOps, logUpdate]);
    const log = results[results.length - 1] as Awaited<typeof logUpdate>;

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
