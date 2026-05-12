import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HistoryView } from "@/components/sections/HistoryView";

const FREE_HISTORY_LIMIT = 3;

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  const isAdmin = adminEmails.includes(session.user.email ?? "");
  const limit = isAdmin ? 50 : FREE_HISTORY_LIMIT;

  const [translations, totalCount] = await Promise.all([
    prisma.translation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    isAdmin
      ? Promise.resolve(limit)
      : prisma.translation.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <HistoryView
      translations={translations}
      totalCount={totalCount}
      isAdmin={isAdmin}
    />
  );
}
