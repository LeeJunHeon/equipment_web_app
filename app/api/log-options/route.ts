import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 모든 옵션 조회
export async function GET() {
  try {
    const [ventReasons, cleaningTypes] = await Promise.all([
      prisma.ventReasonOption.findMany({ orderBy: { id: "asc" } }),
      prisma.cleaningTypeOption.findMany({ orderBy: { id: "asc" } }),
    ]);
    return NextResponse.json({ ventReasons, cleaningTypes });
  } catch (error) {
    console.error("log-options GET error:", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}

// POST: 새 옵션 추가
export async function POST(req: Request) {
  try {
    const { type, label } = await req.json();
    if (!label?.trim()) {
      return NextResponse.json({ error: "라벨을 입력해주세요." }, { status: 400 });
    }
    if (type === "vent") {
      const created = await prisma.ventReasonOption.create({
        data: { label: label.trim() },
      });
      return NextResponse.json(created);
    }
    if (type === "cleaning") {
      const created = await prisma.cleaningTypeOption.create({
        data: { label: label.trim() },
      });
      return NextResponse.json(created);
    }
    return NextResponse.json({ error: "올바르지 않은 type" }, { status: 400 });
  } catch (error) {
    console.error("log-options POST error:", error);
    return NextResponse.json({ error: "추가 실패" }, { status: 500 });
  }
}

// DELETE: 옵션 삭제
export async function DELETE(req: Request) {
  try {
    const { type, id } = await req.json();
    if (type === "vent") {
      await prisma.ventReasonOption.delete({ where: { id: Number(id) } });
    } else if (type === "cleaning") {
      await prisma.cleaningTypeOption.delete({ where: { id: Number(id) } });
    } else {
      return NextResponse.json({ error: "올바르지 않은 type" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("log-options DELETE error:", error);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
