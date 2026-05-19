"use client";

import Image from "next/image";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";

const ACCOUNT_NUMBER = "MN88000500 5427010779";

const content = {
  en: {
    monthly: {
      greeting: "Hello!",
      body: `If you want to subscribe to Orbit Monthly, please send ₮25,000 to ${ACCOUNT_NUMBER} with your email address in the payment description to activate your account.`,
    },
    vip: {
      greeting: "Hello!",
      body: `If you want to subscribe to Orbit VIP, please send ₮1,990,000 to ${ACCOUNT_NUMBER} with your email address in the payment description to activate your account.`,
    },
    accountLabel: "Bank account",
    copy: "Copy",
    copied: "Copied!",
    note: "Your account will be activated within 24 hours after payment is confirmed.",
    back: "Back to home",
    goFree: "Continue with Free",
  },
  mn: {
    monthly: {
      greeting: "Сайн байна уу!",
      body: `Хэрэв та Orbit Сарын хувилбарыг авахыг хүсвэл ${ACCOUNT_NUMBER} данс руу ₮25,000 шилжүүлж, гүйлгээний утга дээр өөрийн имэйл хаягаа бичнэ үү. Ингэснээр идэвхжүүлэлт хийгдэх болно.`,
    },
    vip: {
      greeting: "Сайн байна уу!",
      body: `Хэрэв та Orbit VIP-г авахыг хүсвэл ${ACCOUNT_NUMBER} данс руу ₮1,990,000 шилжүүлж, гүйлгээний утга дээр өөрийн имэйл хаягаа бичнэ үү. Ингэснээр идэвхжүүлэлт хийгдэх болно.`,
    },
    accountLabel: "Дансны дугаар",
    copy: "Хуулах",
    copied: "Хуулагдлаа!",
    note: "Төлбөр баталгаажсанаас хойш 24 цагийн дотор бүртгэл идэвхжинэ.",
    back: "Нүүр хуудас руу",
    goFree: "Үнэгүй үргэлжлүүлэх",
  },
};

export default function SubscribePage({ params }: { params: { plan: string } }) {
  const { plan } = params;
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  const tr = content[lang];
  const planKey = plan === "vip" ? "vip" : "monthly";
  const planContent = tr[planKey];

  function handleCopy() {
    navigator.clipboard.writeText(ACCOUNT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <Image src="/images/orbit-logo.png" alt="Orbit" width={36} height={36} className="rounded-full" />
        <span className="font-display font-bold text-xl text-cosmos-star tracking-tight">Orbit</span>
      </Link>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-cosmos-purple-bright/20 shadow-cosmic space-y-6 text-center">
        {/* Plan badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cosmos-purple-bright/30 bg-cosmos-purple-bright/10 text-sm text-cosmos-purple-light font-semibold">
          {planKey === "vip" ? "VIP" : lang === "mn" ? "Сарын" : "Monthly"}
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold text-cosmos-star mb-3">{planContent.greeting}</h1>
          <p className="text-cosmos-dust leading-relaxed text-sm">{planContent.body}</p>
        </div>

        {/* Account number copy box */}
        <div className="rounded-xl bg-white/[0.04] border border-cosmos-purple-bright/20 p-4">
          <p className="text-xs text-cosmos-dust/50 mb-1">{tr.accountLabel}</p>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-cosmos-star font-semibold tracking-wide">{ACCOUNT_NUMBER}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-cosmos-dust/60 hover:text-cosmos-star transition-colors flex-shrink-0"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? tr.copied : tr.copy}
            </button>
          </div>
        </div>

        <p className="text-xs text-cosmos-dust/50">{tr.note}</p>

        <div className="flex flex-col gap-2 pt-2">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">{tr.goFree}</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full text-cosmos-dust/60">{tr.back}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
