import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PageKey } from "@/lib/menus";
import { eventTypePage, parsePortalLogsLimit } from "@/lib/portalLogs";

export const dynamic = "force-dynamic";

interface PortalLog {
  id: number;
  eventType: string;
  equipmentName: string;
  // 이름은 포털 호환을 위해 occurredAt 이지만 값은 createdAt(입력한 시각, 실제 UTC 절대시각)이다.
  // occurred_at 은 KST 벽시계를 naive timestamp 로 저장한 값(lib/kst.ts)이라 그대로 내보내면 9시간 어긋난다.
  occurredAt: string;
  page?: PageKey;
}

// GET /api/portal-logs?limit=10
// 포털 홈 활동 로그용: 최근 입력된 이력 N건만 가벼운 형태로 준다(사진·정지 구간·본문 없음).
// 장비 앱 화면이 쓰는 /api/logs 는 전체 이력을 주므로 포털은 이쪽을 쓴다.
// 로그인 여부는 proxy 의 "/api/* 미인증 401" 규칙이 막는다.
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const limit = parsePortalLogsLimit(request.nextUrl.searchParams.get("limit"));

    const logs = await prisma.equipmentLog.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      select: {
        id: true,
        eventType: true,
        createdAt: true,
        equipment: { select: { name: true } },
      },
    });

    const data: PortalLog[] = logs.map((log) => {
      const page = eventTypePage(log.eventType);
      return {
        id: log.id,
        eventType: log.eventType,
        equipmentName: log.equipment.name,
        occurredAt: log.createdAt.toISOString(),
        ...(page ? { page } : {}),
      };
    });

    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error("GET /api/portal-logs error:", error);
    return NextResponse.json([], { headers });
  }
}
