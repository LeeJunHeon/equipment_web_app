import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUserRole(): Promise<string | null> {
  try {
    const session = await auth();
    if (!session?.user?.email) return null;

    const user = await prisma.inventoryUser.findUnique({
      where: { email: session.user.email },
      select: { role: true, isActive: true },
    });

    if (!user || user.isActive !== "Y") return null;
    return user.role ?? null;
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const role = await getSessionUserRole();
  return role === "admin";
}
