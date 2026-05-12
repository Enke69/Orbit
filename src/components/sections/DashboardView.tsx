"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { UsageMeter } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { FileText, Plus, History, Zap, Clock, Download } from "lucide-react";
import { format } from "date-fns";
import { formatCharCount } from "@/lib/utils";
import { FREE_CHARS_PER_MONTH } from "@/lib/openai";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

interface Translation {
  id: string;
  originalFileName: string;
  createdAt: Date;
  charCount: number;
  status: string;
  translatedFilePath: string | null;
}

interface Props {
  userName: string | null | undefined;
  charsUsed: number;
  charsPaid: number;
  month: string;
  recentTranslations: Translation[];
}

export function DashboardView({ userName, charsUsed, charsPaid, month, recentTranslations }: Props) {
  const { lang } = useLanguage();
  const tr = t[lang].dashboard;
  const trStatus = t[lang].status;

  const totalAllowance = FREE_CHARS_PER_MONTH + charsPaid;
  const remaining = Math.max(0, totalAllowance - charsUsed);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-cosmos-star">
            {tr.welcomeBack}{userName ? `, ${userName.split(" ")[0]}` : ""}
          </h1>
          <p className="text-cosmos-dust mt-1">{tr.subtitle}</p>
        </div>
        <Link href="/translate">
          <Button size="lg" className="gap-2">
            <Plus size={16} /> {tr.newTranslation}
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap size={16} className="text-cosmos-purple-light" /> {tr.monthlyUsage}
            </CardTitle>
            <CardDescription>{month}</CardDescription>
          </CardHeader>
          <UsageMeter
            used={charsUsed}
            total={totalAllowance}
            label={`${formatCharCount(remaining)} ${tr.remaining}`}
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-cosmos-dust">
              {formatCharCount(FREE_CHARS_PER_MONTH)} {tr.free} · {formatCharCount(charsPaid)} {tr.paidCredits}
            </span>
            <Link href="/translate">
              <Button variant="outline" size="sm">{tr.topUp}</Button>
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History size={16} className="text-cosmos-purple-light" /> {tr.totalJobs}
            </CardTitle>
          </CardHeader>
          <p className="text-4xl font-bold font-display text-cosmos-star">
            {recentTranslations.length}
          </p>
          <p className="text-xs text-cosmos-dust mt-1">{tr.thisSession}</p>
        </Card>
      </div>

      {/* Recent translations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock size={16} className="text-cosmos-purple-light" /> {tr.recentTranslations}
            </CardTitle>
            <Link href="/history" className="text-xs text-cosmos-purple-light hover:text-cosmos-purple-glow">
              {tr.viewAll}
            </Link>
          </div>
        </CardHeader>

        {recentTranslations.length === 0 ? (
          <div className="text-center py-10">
            <FileText size={32} className="text-cosmos-dust/30 mx-auto mb-3" />
            <p className="text-cosmos-dust text-sm">{tr.noTranslations}</p>
            <Link href="/translate" className="mt-3 inline-block">
              <Button size="sm" className="mt-2">{tr.uploadFirst}</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-cosmos-purple-bright/10">
            {recentTranslations.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-cosmos-purple-bright/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-cosmos-purple-light" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cosmos-star truncate">{item.originalFileName}</p>
                    <p className="text-xs text-cosmos-dust">{format(item.createdAt, "MMM d, yyyy · h:mm a")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-cosmos-dust hidden sm:block">
                    {item.charCount.toLocaleString()} {tr.chars}
                  </span>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
