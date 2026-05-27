"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileText, Download, Clock, Search, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

interface Translation {
  id: string;
  originalFileName: string;
  createdAt: Date;
  charCount: number;
  status: string;
  sourceLanguage: string | null;
  translatedFilePath: string | null;
}

interface Props {
  translations: Translation[];
  totalCount: number;
  isAdmin: boolean;
  hiddenCount?: number;
}

export function HistoryView({ translations, totalCount, isAdmin, hiddenCount = 0 }: Props) {
  const { lang } = useLanguage();
  const tr = t[lang].history;
  const trStatus = t[lang].status;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-cosmos-star">{tr.title}</h1>
          <p className="text-cosmos-dust mt-1">
            {isAdmin ? tr.totalJobs(totalCount) : tr.lastN(translations.length)}
          </p>
        </div>
        <Link href="/translate">
          <Button className="gap-2">{tr.newTranslation}</Button>
        </Link>
      </div>

      {translations.length === 0 ? (
        <Card className="text-center py-16">
          <Search size={36} className="text-cosmos-dust/30 mx-auto mb-4" />
          <p className="text-cosmos-dust">{tr.noTranslations}</p>
          <Link href="/translate" className="mt-4 inline-block">
            <Button size="sm" className="mt-2">{tr.uploadFirst}</Button>
          </Link>
        </Card>
      ) : (
        <Card className="divide-y divide-cosmos-purple-bright/10 p-0 overflow-hidden">
          {translations.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cosmos-purple-bright/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-cosmos-purple-light" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cosmos-star truncate max-w-xs">
                    {item.originalFileName}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-cosmos-dust flex items-center gap-1">
                      <Clock size={10} />
                      {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                    </span>
                    {item.sourceLanguage && (
                      <span className="text-xs text-cosmos-dust">
                        {item.sourceLanguage} → {tr.translated}
                      </span>
                    )}
                    <span className="text-xs text-cosmos-dust">
                      {item.charCount.toLocaleString()} {tr.chars}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <Badge variant={
                  item.status === "DONE" ? "success" :
                  item.status === "PROCESSING" ? "info" :
                  item.status === "PENDING" ? "warning" : "error"
                }>
                  {trStatus[item.status as keyof typeof trStatus] ?? item.status}
                </Badge>
                {item.status === "DONE" && item.translatedFilePath && (
                  <a href={`/api/download/${item.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Download size={13} />
                      <span className="hidden sm:inline">{tr.download}</span>
                    </Button>
                  </a>
                )}
                {item.status === "FAILED" && (
                  <Link href="/translate">
                    <Button variant="ghost" size="sm">{tr.retry}</Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      {!isAdmin && hiddenCount > 0 && (
        <div className="mt-4 glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 border border-cosmos-purple-bright/20">
          <div className="w-10 h-10 rounded-xl bg-cosmos-purple-bright/10 border border-cosmos-purple-bright/20 flex items-center justify-center flex-shrink-0">
            <Lock size={18} className="text-cosmos-purple-light" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-cosmos-star">
              {tr.hiddenBanner(hiddenCount)}
            </p>
            <p className="text-xs text-cosmos-dust/60 mt-0.5">
              {tr.hiddenSub(3)}
            </p>
          </div>
          <Link href="/dashboard" className="flex-shrink-0">
            <Button size="sm" className="gap-1.5">{tr.upgradePro}</Button>
          </Link>
        </div>
      )}

      <p className="text-center text-xs text-cosmos-dust/40 mt-6">
        {tr.autoDelete}
      </p>
    </div>
  );
}
