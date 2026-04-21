import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json({ error: "이력 조회 실패" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      equipmentId, eventType, occurredAt, operator, description,
      status,
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

    const log = await prisma.equipmentLog.create({
      data: {
        equipmentId: Number(equipmentId),
        eventType,
        occurredAt: new Date(occurredAt),
        operator,
        description: description || null,
        status: status || "처리중",
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
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "이력 ID는 필수입니다." }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (updateData.status !== undefined) data.status = updateData.status;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.operator !== undefined) data.operator = updateData.operator;
    if (updateData.occurredAt !== undefined) data.occurredAt = new Date(updateData.occurredAt);
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
