"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Users, Crown, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

type Plan = "FREE" | "WEEKLY" | "MONTHLY" | "VIP";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  plan: Plan;
  planExpiresAt: Date | null;
  createdAt: Date;
  _count: { translations: number };
}

const PLAN_VARIANTS: Record<Plan, "default" | "info" | "warning" | "success"> = {
  FREE: "default",
  WEEKLY: "warning",
  MONTHLY: "info",
  VIP: "success",
};

const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Free",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  VIP: "VIP",
};

export function AdminView({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const [expiryInputs, setExpiryInputs] = useState<Record<string, string>>({});

  async function setPlan(userId: string, plan: Plan) {
    setLoading(userId + plan);
    const expiresAt = expiryInputs[userId] || undefined;

    try {
      const res = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan, expiresAt }),
      });
      if (!res.ok) throw new Error();
      const { user: updated } = await res.json();
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan: updated.plan, planExpiresAt: updated.planExpiresAt ? new Date(updated.planExpiresAt) : null } : u));
      toast.success(`Plan updated to ${PLAN_LABELS[plan]}`);
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-cosmos-purple-bright/10 border border-cosmos-purple-bright/20 flex items-center justify-center">
          <Crown size={18} className="text-cosmos-purple-light" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-cosmos-star">Admin Panel</h1>
          <p className="text-cosmos-dust text-sm mt-0.5">{users.length} users total</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(["FREE", "WEEKLY", "MONTHLY", "VIP"] as Plan[]).map((plan) => {
          const count = users.filter((u) => u.plan === plan).length;
          return (
            <Card key={plan} className="text-center py-4">
              <Badge variant={PLAN_VARIANTS[plan]} className="mb-2">{PLAN_LABELS[plan]}</Badge>
              <p className="text-2xl font-bold font-display text-cosmos-star">{count}</p>
            </Card>
          );
        })}
      </div>

      {/* User table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-cosmos-purple-bright/10 flex items-center gap-2">
          <Users size={16} className="text-cosmos-purple-light" />
          <span className="font-semibold text-cosmos-star text-sm">All users</span>
        </div>
        <div className="divide-y divide-cosmos-purple-bright/10">
          {users.map((user) => (
            <div key={user.id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Avatar + info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {user.image ? (
                  <img src={user.image} alt="" className="w-9 h-9 rounded-full border border-cosmos-purple-bright/30 flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-cosmos-purple-dark flex items-center justify-center flex-shrink-0 text-xs text-cosmos-star font-bold">
                    {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cosmos-star truncate">{user.name ?? "—"}</p>
                  <p className="text-xs text-cosmos-dust truncate">{user.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-cosmos-dust flex-shrink-0">
                <span>{user._count.translations} translations</span>
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {format(user.createdAt, "MMM d, yyyy")}
                </span>
                {user.planExpiresAt && (
                  <span className="text-cosmos-dust/50">
                    expires {format(user.planExpiresAt, "MMM d, yyyy")}
                  </span>
                )}
              </div>

              {/* Current plan */}
              <div className="flex-shrink-0">
                <Badge variant={PLAN_VARIANTS[user.plan]}>{PLAN_LABELS[user.plan]}</Badge>
              </div>

              {/* Expiry input */}
              <div className="flex-shrink-0">
                <input
                  type="date"
                  value={expiryInputs[user.id] ?? ""}
                  onChange={(e) => setExpiryInputs((prev) => ({ ...prev, [user.id]: e.target.value }))}
                  className="text-xs bg-white/[0.04] border border-cosmos-purple-bright/20 rounded-lg px-2 py-1.5 text-cosmos-dust focus:outline-none focus:border-cosmos-purple-bright/50"
                  title="Plan expiry date (optional)"
                />
              </div>

              {/* Plan buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {(["FREE", "WEEKLY", "MONTHLY", "VIP"] as Plan[]).map((plan) => (
                  <Button
                    key={plan}
                    size="sm"
                    variant={user.plan === plan ? "cosmic" : "outline"}
                    loading={loading === user.id + plan}
                    onClick={() => setPlan(user.id, plan)}
                    className="text-xs"
                  >
                    {PLAN_LABELS[plan]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
