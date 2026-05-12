"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FileText, Zap, Shield, Globe, ArrowRight, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

export default function HomePage() {
  const { lang } = useLanguage();
  const tr = t[lang].home;

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 text-center">
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-cosmos-purple-bright/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-cosmos-blue-bright/8 blur-3xl pointer-events-none" />

        {/* Heading */}
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-cosmos-star mb-6 leading-tight max-w-4xl">
          {tr.heroHeading}{" "}
          <span className="bg-gradient-to-r from-cosmos-purple-light via-cosmos-blue-light to-cosmos-cyan-glow bg-clip-text text-transparent glow-text">
            {tr.heroHighlight}
          </span>
        </h1>

        <p className="text-lg text-cosmos-dust max-w-2xl mb-10 leading-relaxed">
          {tr.heroSub}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/text">
            <Button size="lg" className="gap-2">
              {tr.cta} <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/translate">
            <Button variant="outline" size="lg">{tr.ctaDoc}</Button>
          </Link>
        </div>

        {/* Free tier note */}
        <p className="mt-6 text-sm text-cosmos-dust/60 flex items-center gap-1.5">
          <CheckCircle size={13} className="text-emerald-400" />
          {tr.freeNote}
        </p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="font-display text-3xl font-bold text-cosmos-star text-center mb-12">
          {tr.featuresHeading}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {([FileText, Shield, Globe, Zap] as const).map((Icon, i) => (
            <Card key={i} hover className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-cosmos-purple-bright/15 border border-cosmos-purple-bright/20 flex items-center justify-center text-cosmos-purple-light">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-cosmos-star font-display">{tr.features[i].title}</h3>
              <p className="text-sm text-cosmos-dust leading-relaxed">{tr.features[i].description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="font-display text-3xl font-bold text-cosmos-star text-center mb-4">{tr.pricingHeading}</h2>
        <p className="text-cosmos-dust text-center mb-12">{tr.pricingSub}</p>
        <div className="grid md:grid-cols-3 gap-6">
          {tr.plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.featured ? "border-cosmos-purple-bright/50 shadow-cosmic" : ""}
              glow={plan.featured}
            >
              {plan.featured && (
                <div className="text-xs font-semibold text-cosmos-purple-light bg-cosmos-purple-bright/15 rounded-full px-3 py-1 w-fit mb-3">
                  {tr.mostPopular}
                </div>
              )}
              <h3 className="font-display font-bold text-xl text-cosmos-star">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-cosmos-star">{plan.price}</span>
                {plan.period && <span className="text-cosmos-dust text-sm ml-1">{plan.period}</span>}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-cosmos-dust">
                    <CheckCircle size={14} className="text-cosmos-purple-light flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signin">
                <Button variant={plan.featured ? "cosmic" : "outline"} className="w-full">
                  {plan.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
