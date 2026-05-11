import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FileText, Download, Clock, Search, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

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

  const hiddenCount = isAdmin ? 0 : Math.max(0, totalCount - FREE_HISTORY_LIMIT);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-cosmos-star">Translation history</h1>
          <p className="text-cosmos-dust mt-1">
            {isAdmin ? `${totalCount} jobs total` : `Last ${translations.length} translation${translations.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/translate">
          <Button className="gap-2">New translation</Button>
        </Link>
      </div>

      {translations.length === 0 ? (
        <Card className="text-center py-16">
          <Search size={36} className="text-cosmos-dust/30 mx-auto mb-4" />
          <p className="text-cosmos-dust">No translations yet.</p>
          <Link href="/translate" className="mt-4 inline-block">
            <Button size="sm" className="mt-2">Upload your first document</Button>
          </Link>
        </Card>
      ) : (
        <Card className="divide-y divide-cosmos-purple-bright/10 p-0 overflow-hidden">
          {translations.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
            >
              {/* Left */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cosmos-purple-bright/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-cosmos-purple-light" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cosmos-star truncate max-w-xs">
                    {t.originalFileName}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-cosmos-dust flex items-center gap-1">
                      <Clock size={10} />
                      {formatDistanceToNow(t.createdAt, { addSuffix: true })}
                    </span>
                    {t.sourceLanguage && (
                      <span className="text-xs text-cosmos-dust">
                        {t.sourceLanguage} → Translated
                      </span>
                    )}
                    <span className="text-xs text-cosmos-dust">
                      {t.charCount.toLocaleString()} chars
                    </span>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <StatusBadge status={t.status} />
                {t.status === "DONE" && t.translatedFilePath && (
                  <a href={`/api/download/${t.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Download size={13} />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </a>
                )}
                {t.status === "FAILED" && (
                  <Link href="/translate">
                    <Button variant="ghost" size="sm">Retry</Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Free-tier hidden history banner */}
      {!isAdmin && hiddenCount > 0 && (
        <div className="mt-4 glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 border border-cosmos-purple-bright/20">
          <div className="w-10 h-10 rounded-xl bg-cosmos-purple-bright/10 border border-cosmos-purple-bright/20 flex items-center justify-center flex-shrink-0">
            <Lock size={18} className="text-cosmos-purple-light" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-cosmos-star">
              {hiddenCount} older translation{hiddenCount !== 1 ? "s" : ""} hidden
            </p>
            <p className="text-xs text-cosmos-dust/60 mt-0.5">
              Free accounts show the last {FREE_HISTORY_LIMIT} only. Upgrade to Pro for full history access.
            </p>
          </div>
          <Link href="/dashboard" className="flex-shrink-0">
            <Button size="sm" className="gap-1.5">Upgrade to Pro</Button>
          </Link>
        </div>
      )}

      <p className="text-center text-xs text-cosmos-dust/40 mt-6">
        Files are automatically deleted 7 days after translation.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "default" | "success" | "warning" | "error" | "info"; label: string }> = {
    PENDING:    { variant: "warning", label: "Pending"        },
    PROCESSING: { variant: "info",    label: "Translating..." },
    DONE:       { variant: "success", label: "Done"           },
    FAILED:     { variant: "error",   label: "Failed"         },
  };
  const { variant, label } = map[status] ?? { variant: "default", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}
