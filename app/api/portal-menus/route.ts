import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserRole } from "@/lib/auth-utils";
import {
  canAccessPage,
  EQUIPMENT_MENU_ICON,
  SIDEBAR_ORDER,
  STATIC_MENUS,
  type PortalIcon,
} from "@/lib/menus";

export const dynamic = "force-dynamic";

interface PortalMenu {
  page: string;
  id?: number;
  label: string;
  icon: PortalIcon;
  adminOnly: boolean;
}

// GET /api/portal-menus
// 포털 런처용: 지금 로그인한 사용자가 사이드바에서 볼 수 있는 메뉴를 사이드바와 같은 순서로 준다.
// 로그인 여부는 proxy 의 "/api/* 미인증 401" 규칙이 막는다. 같은 origin 이라 CORS 는 필요 없다.
// 메뉴 구성이 사용자·장비 상태에 따라 달라지므로 캐시하지 않는다.
export async function GET() {
  try {
    // /api/me 와 같은 규칙. 역할 조회 실패는 일반 직원으로 본다.
    const isAdmin = (await getSessionUserRole()) === "admin";

    // 사이드바와 같은 조건(GET /api/equipment: 활성 장비, id 오름차순)
    const equipments = await prisma.equipment.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });

    const menus: PortalMenu[] = [];
    for (const page of SIDEBAR_ORDER) {
      if (!canAccessPage(page, isAdmin)) continue;
      if (page === "equipment") {
        for (const eq of equipments) {
          menus.push({ page, id: eq.id, label: eq.name, icon: EQUIPMENT_MENU_ICON, adminOnly: false });
        }
        continue;
      }
      const def = STATIC_MENUS[page];
      menus.push({ page, label: def.label, icon: def.icon, adminOnly: def.adminOnly });
    }

    return NextResponse.json(
      { app: "equipment", menus },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/portal-menus error:", error);
    return NextResponse.json(
      { error: "메뉴 목록 조회 실패" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
