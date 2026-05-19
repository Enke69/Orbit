import { prisma } from "./prisma";

export type Plan = "FREE" | "MONTHLY" | "VIP";

export const PLAN_LIMITS: Record<Plan, { daily: number; monthly: number | null }> = {
  FREE:    { daily: 1,   monthly: null },
  MONTHLY: { daily: 3,   monthly: 75   },
  VIP:     { daily: 100, monthly: null },
};

export const TEXT_LIMITS: Record<Plan, { daily: number; maxChars: number | null }> = {
  FREE:    { daily: 3,   maxChars: 15_000 },
  MONTHLY: { daily: 10,  maxChars: 20_000 },
  VIP:     { daily: 100, maxChars: null   },
};

export const PLAN_LABELS: Record<Plan, { en: string; mn: string }> = {
  FREE:    { en: "Free",    mn: "Үнэгүй" },
  MONTHLY: { en: "Monthly", mn: "Сарын"  },
  VIP:     { en: "VIP",     mn: "VIP"    },
};

export async function getEffectivePlan(userId: string): Promise<{ plan: Plan; isAdmin: boolean; planExpiresAt: Date | null }> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, plan: true, planExpiresAt: true },
  });

  if (!user) return { plan: "FREE", isAdmin: false, planExpiresAt: null };

  const isAdmin = adminEmails.includes(user.email ?? "");
  let plan = user.plan as Plan;

  // Expire paid plans if past the expiry date
  if (plan !== "FREE" && user.planExpiresAt && user.planExpiresAt < new Date()) {
    plan = "FREE";
  }

  return { plan, isAdmin, planExpiresAt: user.planExpiresAt };
}

export async function checkTranslationQuota(userId: string): Promise<{
  allowed: boolean;
  plan: Plan;
  isAdmin: boolean;
  dailyCount: number;
  monthlyCount: number;
  error?: string;
}> {
  const { plan, isAdmin, planExpiresAt: _ } = await getEffectivePlan(userId);

  if (isAdmin) {
    return { allowed: true, plan, isAdmin: true, dailyCount: 0, monthlyCount: 0 };
  }

  const limits = PLAN_LIMITS[plan];

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [dailyCount, monthlyCount] = await Promise.all([
    prisma.translation.count({ where: { userId, createdAt: { gte: since24h } } }),
    prisma.translation.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
  ]);

  if (dailyCount >= limits.daily) {
    return {
      allowed: false,
      plan,
      isAdmin: false,
      dailyCount,
      monthlyCount,
      error: `Daily limit reached (${limits.daily}/day). Try again tomorrow.`,
    };
  }

  if (limits.monthly !== null && monthlyCount >= limits.monthly) {
    return {
      allowed: false,
      plan,
      isAdmin: false,
      dailyCount,
      monthlyCount,
      error: `Monthly limit reached (${limits.monthly}/month).`,
    };
  }

  return { allowed: true, plan, isAdmin: false, dailyCount, monthlyCount };
}

export async function checkTextQuota(userId: string, charCount: number): Promise<{
  allowed: boolean;
  plan: Plan;
  isAdmin: boolean;
  error?: string;
}> {
  const { plan, isAdmin } = await getEffectivePlan(userId);

  if (isAdmin) return { allowed: true, plan, isAdmin: true };

  const limits = TEXT_LIMITS[plan];

  if (limits.maxChars !== null && charCount > limits.maxChars) {
    return {
      allowed: false,
      plan,
      isAdmin: false,
      error: `Text too long. Your plan allows up to ${limits.maxChars.toLocaleString()} characters per translation.`,
    };
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dailyCount = await prisma.textUsage.count({ where: { userId, createdAt: { gte: since24h } } });

  if (dailyCount >= limits.daily) {
    return {
      allowed: false,
      plan,
      isAdmin: false,
      error: `Daily text translation limit reached (${limits.daily}/day). Try again tomorrow.`,
    };
  }

  return { allowed: true, plan, isAdmin: false };
}

export async function recordTextUsage(userId: string): Promise<void> {
  await prisma.textUsage.create({ data: { userId } });
}
