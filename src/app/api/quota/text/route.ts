import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan, TEXT_LIMITS } from "@/lib/quota";

export const dynamic = "force-dynamic";

// Text-translation limits for the signed-in user — the client uses this to
// show the correct character cap and remaining daily translations instead of
// a hardcoded constant.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan, isAdmin } = await getEffectivePlan(session.user.id);
  const limits = TEXT_LIMITS[plan];

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const usedToday = await prisma.textUsage.count({
    where: { userId: session.user.id, createdAt: { gte: since24h } },
  });

  return NextResponse.json({
    plan,
    isAdmin,
    maxChars: limits.maxChars,
    dailyLimit: limits.daily,
    usedToday,
  });
}
