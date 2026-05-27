import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HistoryView } from "@/components/sections/HistoryView";
import { getEffectivePlan } from "@/lib/quota";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  const isAdmin = adminEmails.includes(session.user.email ?? "");

  let translations;
  let totalCount: number;
  let hiddenCount = 0;

  if (isAdmin) {
    translations = await prisma.translation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    totalCount = translations.length;
  } else {
    const { plan } = await getEffectivePlan(userId);

    if (plan === "FREE") {
      const FREE_LIMIT = 3;
      [translations, totalCount] = await Promise.all([
        prisma.translation.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: FREE_LIMIT,
        }),
        prisma.translation.count({ where: { userId } }),
      ]);
      hiddenCount = Math.max(0, totalCount - FREE_LIMIT);
    } else {
      const days = plan === "VIP" ? 180 : 30; // MONTHLY = 30 days, VIP = 180 days
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      translations = await prisma.translation.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
      });
      totalCount = translations.length;
    }
  }

  return (
    <HistoryView
      translations={translations}
      totalCount={totalCount}
      isAdmin={isAdmin}
      hiddenCount={hiddenCount}
    />
  );
}
