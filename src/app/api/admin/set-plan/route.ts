import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  if (!adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, plan, expiresAt } = (await req.json()) as {
    userId: string;
    plan: "FREE" | "WEEKLY" | "MONTHLY" | "VIP";
    expiresAt?: string;
  };

  if (!userId || !["FREE", "WEEKLY", "MONTHLY", "VIP"].includes(plan)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      planExpiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    select: { id: true, email: true, plan: true, planExpiresAt: true },
  });

  return NextResponse.json({ user });
}
