import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FileText, Zap, Shield, Globe, ArrowRight, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 text-center">
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-cosmos-purple-bright/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-cosmos-blue-bright/8 blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cosmos-purple-bright/30 bg-cosmos-purple-bright/10 text-sm text-cosmos-purple-light">
          <Zap size={13} className="text-cosmos-purple-bright" />
          Powered by GPT‑5.4 mini
        </div>

        {/* Heading */}
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-cosmos-star mb-6 leading-tight max-w-4xl">
          Translate any document{" "}
          <span className="bg-gradient-to-r from-cosmos-purple-light via-cosmos-blue-light to-cosmos-cyan-glow bg-clip-text text-transparent glow-text">
            instantly
          </span>
        </h1>

        <p className="text-lg text-cosmos-dust max-w-2xl mb-10 leading-relaxed">
          Upload a PDF or Word document. Orbit translates the text while keeping your images, tables,
          and layout exactly where they were. Download the result instantly.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/translate">
            <Button size="lg" className="gap-2">
              Start translating <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/signin">
            <Button variant="outline" size="lg">Sign in free</Button>
          </Link>
        </div>

        {/* Free tier note */}
        <p className="mt-6 text-sm text-cosmos-dust/60 flex items-center gap-1.5">
          <CheckCircle size={13} className="text-emerald-400" />
          15,000 characters free every month. No credit card required.
        </p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="font-display text-3xl font-bold text-cosmos-star text-center mb-12">
          Everything you need for professional translation
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Card key={f.title} hover className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-cosmos-purple-bright/15 border border-cosmos-purple-bright/20 flex items-center justify-center text-cosmos-purple-light">
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-cosmos-star font-display">{f.title}</h3>
              <p className="text-sm text-cosmos-dust leading-relaxed">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="font-display text-3xl font-bold text-cosmos-star text-center mb-4">Simple pricing</h2>
        <p className="text-cosmos-dust text-center mb-12">Start free. Top up only when you need more.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.featured ? "border-cosmos-purple-bright/50 shadow-cosmic" : ""}
              glow={plan.featured}
            >
              {plan.featured && (
                <div className="text-xs font-semibold text-cosmos-purple-light bg-cosmos-purple-bright/15 rounded-full px-3 py-1 w-fit mb-3">
                  Most popular
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

const features = [
  {
    icon: FileText,
    title: "PDF & Word support",
    description: "Upload .pdf, .doc, or .docx files. Download as PDF or Word.",
  },
  {
    icon: Shield,
    title: "Layout preserved",
    description: "Images, tables, and formatting stay exactly where they were.",
  },
  {
    icon: Globe,
    title: "Any source language",
    description: "English, Russian, Chinese, Korean, and 50+ more — auto-detected.",
  },
  {
    icon: Zap,
    title: "Context-aware",
    description: "The AI remembers terminology across the whole document for consistent output.",
  },
];

const plans = [
  {
    name: "Free",
    price: "₮0",
    period: "/ month",
    featured: false,
    cta: "Get started",
    features: [
      "15,000 characters / month",
      "PDF & Word upload",
      "Download as DOCX or PDF",
      "All source languages",
    ],
  },
  {
    name: "Pro",
    price: "₮25,000",
    period: "/ month",
    featured: true,
    cta: "Go Pro",
    features: [
      "500,000 characters / month",
      "Priority translation queue",
      "Translation history (30 days)",
      "Email support",
    ],
  },
  {
    name: "Top-up",
    price: "₮500",
    period: "per 1,000 chars",
    featured: false,
    cta: "Pay as you go",
    features: [
      "Buy only what you need",
      "Credits never expire",
      "Same quality as Pro",
      "QPay supported",
    ],
  },
];
