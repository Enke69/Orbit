"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileText, Plus, History, Clock, Download, Crown, Zap, Shield } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { PLAN_LIMITS, PLAN_LABELS, type Plan } from "@/lib/quota";

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
  plan: Plan;
  planExpiresAt: Date | null;
  isAdmin: boolean;
  dailyCount: number;
  monthlyCount: number;
  recentTranslations: Translation[];
}

const PLAN_BADGE_VARIANTS: Record<Plan, "default" | "info" | "warning" | "success"> = {
  FREE: "default",
  WEEKLY: "warning",
  MONTHLY: "info",
  VIP: "success",
};

const PLAN_ICONS: Record<Plan, typeof Zap> = {
  FREE: Zap,
  WEEKLY: Zap,
  MONTHLY: Crown,
  VIP: Crown,
};

export function DashboardView({ userName, plan, planExpiresAt, isAdmin, dailyCount, monthlyCount, recentTranslations }: Props) {
  const { lang } = useLanguage();
  const tr = t[lang].dashboard;
  const trStatus = t[lang].status;

  const limits = PLAN_LIMITS[plan];
  const planLabel = PLAN_LABELS[plan][lang as "en" | "mn"];
  const PlanIcon = PLAN_ICONS[plan];

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
        {/* Plan card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlanIcon size={16} className="text-cosmos-purple-light" /> {tr.plan}
            </CardTitle>
          </CardHeader>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {isAdmin ? (
              <Badge variant="warning" className="flex items-center gap-1">
                <Shield size={11} /> {tr.adminBadge}
              </Badge>
            ) : (
              <Badge variant={PLAN_BADGE_VARIANTS[plan]}>{planLabel}</Badge>
            )}
          </div>
          {planExpiresAt && !isAdmin && (
            <p className="text-xs text-cosmos-dust/50 mt-2">
              {tr.expires} {format(planExpiresAt, "MMM d, yyyy")}
            </p>
          )}
          {plan === "FREE" && !isAdmin && (
            <Link href="/#pricing" className="mt-3 inline-block">
              <Button variant="outline" size="sm">{tr.topUp}</Button>
            </Link>
          )}
        </Card>

        {/* Today's usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={16} className="text-cosmos-purple-light" /> {tr.todayUsage}
            </CardTitle>
          </CardHeader>
          {isAdmin ? (
            <p className="text-4xl font-bold font-display text-cosmos-star">{dailyCount}</p>
          ) : (
            <>
              <p className="text-4xl font-bold font-display text-cosmos-star">
                {dailyCount}
                <span className="text-lg text-cosmos-dust font-normal"> / {limits.daily}</span>
              </p>
              <ProgressBar
                value={(dailyCount / limits.daily) * 100}
                showPercent={false}
                size="sm"
                className="mt-3"
              />
              <p className="text-xs text-cosmos-dust mt-2">{tr.dailyLimit}</p>
            </>
          )}
        </Card>

        {/* Monthly usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History size={16} className="text-cosmos-purple-light" /> {tr.monthlyUsage}
            </CardTitle>
          </CardHeader>
          {isAdmin ? (
            <>
              <p className="text-4xl font-bold font-display text-cosmos-star">{monthlyCount}</p>
              <p className="text-xs text-cosmos-dust mt-1">{tr.unlimited}</p>
            </>
          ) : limits.monthly !== null ? (
            <>
              <p className="text-4xl font-bold font-display text-cosmos-star">
                {monthlyCount}
                <span className="text-lg text-cosmos-dust font-normal"> / {limits.monthly}</span>
              </p>
              <ProgressBar
                value={(monthlyCount / limits.monthly) * 100}
                showPercent={false}
                size="sm"
                className="mt-3"
              />
              <p className="text-xs text-cosmos-dust mt-2">{tr.monthlyLimit}</p>
            </>
          ) : (
            <>
              <p className="text-4xl font-bold font-display text-cosmos-star">{monthlyCount}</p>
              <p className="text-xs text-cosmos-dust mt-1">{tr.unlimited}</p>
            </>
          )}
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
