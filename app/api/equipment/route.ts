import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const equipments = await prisma.equipment.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      include: {
        logs: {
          where: { eventType: "repair", status: "처리중" },
          select: { id: true },
        },
      },
    });

    const result = equipments.map((eq) => ({
      id: eq.id,
      name: eq.name,
      category: eq.category,
      isVentTarget: eq.isVentTarget,
      isCleaningTarget: eq.isCleaningTarget,
      description: eq.description,
      isActive: eq.isActive,
      createdAt: eq.createdAt,
      unresolvedRepairCount: eq.logs.length,
      ventIntervalDays: eq.ventIntervalDays,
      cleaningIntervalDays: eq.cleaningIntervalDays,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/equipment error:", error);
    return NextResponse.json({ error: "장비 목록 조회 ��패" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, isVentTarget, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "장비명은 필수입니다." }, { status: 400 });
    }

    const equipment = await prisma.equipment.create({
      data: {
        name: name.trim(),
        category: category || null,
        isVentTarget: isVentTarget ?? false,
        isCleaningTarget: body.isCleaningTarget ?? true,
        description: description || null,
        ventIntervalDays: body.ventIntervalDays ?? 30,
        cleaningIntervalDays: body.cleaningIntervalDays ?? 14,
      },
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error("POST /api/equipment error:", error);
    return NextResponse.json({ error: "장비 추가 실패" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, category, isVentTarget, description } = body;

    if (!id) {
      return NextResponse.json({ error: "장비 ID는 필수입��다." }, { status: 400 });
    }

    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(category !== undefined && { category }),
        ...(isVentTarget !== undefined && { isVentTarget }),
        ...(body.isCleaningTarget !== undefined && { isCleaningTarget: body.isCleaningTarget }),
        ...(description !== undefined && { description }),
        ...(body.ventIntervalDays !== undefined && { ventIntervalDays: body.ventIntervalDays }),
        ...(body.cleaningIntervalDays !== undefined && { cleaningIntervalDays: body.cleaningIntervalDays }),
      },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("PATCH /api/equipment error:", error);
    return NextResponse.json({ error: "장비 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "장��� ID는 필수입니다." }, { status: 400 });
    }

    const equipment = await prisma.equipment.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("DELETE /api/equipment error:", error);
    return NextResponse.json({ error: "장비 비��성화 실패" }, { status: 500 });
  }
}
