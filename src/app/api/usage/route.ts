import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMonth } from "@/lib/utils";
import { FREE_CHARS_PER_MONTH } from "@/lib/openai";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const month = getCurrentMonth();
  const usage = await prisma.monthlyUsage.findUnique({
    where: { userId_month: { userId: session.user.id, month } },
  });

  return NextResponse.json({
    month,
    charsUsed: usage?.charsUsed ?? 0,
    charsPaid: usage?.charsPaid ?? 0,
    freeAllowance: FREE_CHARS_PER_MONTH,
    totalAllowance: FREE_CHARS_PER_MONTH + (usage?.charsPaid ?? 0),
  });
}
