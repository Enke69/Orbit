import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminView } from "@/components/sections/AdminView";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  if (!adminEmails.includes(session.user.email)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      plan: true,
      planExpiresAt: true,
      createdAt: true,
      _count: { select: { translations: true } },
    },
  });

  return <AdminView users={users} />;
}
