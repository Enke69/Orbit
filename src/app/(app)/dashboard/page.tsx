import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardView } from "@/components/sections/DashboardView";
import { getEffectivePlan } from "@/lib/quota";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  const isAdmin = adminEmails.includes(session.user.email ?? "");

  const [{ plan, planExpiresAt }, dailyCount, monthlyCount, recentTranslations] = await Promise.all([
    getEffectivePlan(userId),
    prisma.translation.count({ where: { userId, createdAt: { gte: since24h } } }),
    prisma.translation.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    prisma.translation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <DashboardView
      userName={session.user.name}
      plan={plan}
      planExpiresAt={planExpiresAt}
      isAdmin={isAdmin}
      dailyCount={dailyCount}
      monthlyCount={monthlyCount}
      recentTranslations={recentTranslations}
    />
  );
}
