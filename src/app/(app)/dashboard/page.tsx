import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentMonth, formatCharCount } from "@/lib/utils";
import { FREE_CHARS_PER_MONTH } from "@/lib/openai";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { UsageMeter } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { FileText, Plus, History, Zap, Clock } from "lucide-react";
import { format } from "date-fns";

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

  const charsUsed = usage?.charsUsed ?? 0;
  const charsPaid = usage?.charsPaid ?? 0;
  const totalAllowance = FREE_CHARS_PER_MONTH + charsPaid;
  const remaining = Math.max(0, totalAllowance - charsUsed);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-cosmos-star">
            Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-cosmos-dust mt-1">Your translation dashboard</p>
        </div>
        <Link href="/translate">
          <Button size="lg" className="gap-2">
            <Plus size={16} /> New translation
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap size={16} className="text-cosmos-purple-light" /> Monthly usage
            </CardTitle>
            <CardDescription>{month}</CardDescription>
          </CardHeader>
          <UsageMeter
            used={charsUsed}
            total={totalAllowance}
            label={`${formatCharCount(remaining)} remaining`}
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-cosmos-dust">
              {formatCharCount(FREE_CHARS_PER_MONTH)} free · {formatCharCount(charsPaid)} paid credits
            </span>
            <Link href="/translate">
              <Button variant="outline" size="sm">Top up</Button>
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History size={16} className="text-cosmos-purple-light" /> Total jobs
            </CardTitle>
          </CardHeader>
          <p className="text-4xl font-bold font-display text-cosmos-star">
            {recentTranslations.length}
          </p>
          <p className="text-xs text-cosmos-dust mt-1">this session</p>
        </Card>
      </div>

      {/* Recent translations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock size={16} className="text-cosmos-purple-light" /> Recent translations
            </CardTitle>
            <Link href="/history" className="text-xs text-cosmos-purple-light hover:text-cosmos-purple-glow">
              View all →
            </Link>
          </div>
        </CardHeader>

        {recentTranslations.length === 0 ? (
          <div className="text-center py-10">
            <FileText size={32} className="text-cosmos-dust/30 mx-auto mb-3" />
            <p className="text-cosmos-dust text-sm">No translations yet.</p>
            <Link href="/translate" className="mt-3 inline-block">
              <Button size="sm" className="mt-2">Upload your first document</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-cosmos-purple-bright/10">
            {recentTranslations.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-cosmos-purple-bright/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-cosmos-purple-light" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cosmos-star truncate">{t.originalFileName}</p>
                    <p className="text-xs text-cosmos-dust">{format(t.createdAt, "MMM d, yyyy · h:mm a")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-cosmos-dust hidden sm:block">
                    {t.charCount.toLocaleString()} chars
                  </span>
                  <StatusBadge status={t.status} />
                  {t.status === "DONE" && t.translatedFilePath && (
                    <a href={`/api/download/${t.id}`}>
                      <Button variant="outline" size="sm">Download</Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "default" | "success" | "warning" | "error" | "info"; label: string }> = {
    PENDING: { variant: "warning", label: "Pending" },
    PROCESSING: { variant: "info", label: "Translating..." },
    DONE: { variant: "success", label: "Done" },
    FAILED: { variant: "error", label: "Failed" },
  };
  const { variant, label } = map[status] ?? { variant: "default", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}
