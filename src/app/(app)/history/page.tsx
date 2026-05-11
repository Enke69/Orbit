import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FileText, Download, Clock, Search } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const translations = await prisma.translation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-cosmos-star">Translation history</h1>
          <p className="text-cosmos-dust mt-1">{translations.length} jobs total</p>
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
            <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
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

      <p className="text-center text-xs text-cosmos-dust/40 mt-6">
        Files are automatically deleted 7 days after translation.
      </p>
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
