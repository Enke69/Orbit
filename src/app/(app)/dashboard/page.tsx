import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentMonth } from "@/lib/utils";
import { DashboardView } from "@/components/sections/DashboardView";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;
  const month = getCurrentMonth();

  const [usage, recentTranslations] = await Promise.all([
    prisma.monthlyUsage.findUnique({ where: { userId_month: { userId, month } } }),
    prisma.translation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <DashboardView
      userName={session.user.name}
      charsUsed={usage?.charsUsed ?? 0}
      charsPaid={usage?.charsPaid ?? 0}
      month={month}
      recentTranslations={recentTranslations}
    />
  );
}
