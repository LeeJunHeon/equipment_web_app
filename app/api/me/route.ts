import { NextResponse } from "next/server";
import { getSessionUserRole } from "@/lib/auth-utils";

export async function GET() {
  try {
    const role = await getSessionUserRole();
    return NextResponse.json({
      role,
      isAdmin: role === "admin",
    });
  } catch {
    return NextResponse.json({ role: null, isAdmin: false });
  }
}
