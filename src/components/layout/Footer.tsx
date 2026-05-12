"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

export function Footer() {
  const { lang } = useLanguage();
  const tr = t[lang];
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cosmos-purple-bright/10 bg-cosmos-black/60 backdrop-blur-xl mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/orbit-logo.png"
              alt="Orbit"
              width={28}
              height={28}
              className="rounded-full"
            />
            <span className="font-display font-bold text-lg text-cosmos-star tracking-tight">
              Orbit
            </span>
          </div>
          <p className="text-sm text-cosmos-dust/70 max-w-xs">
            {tr.footer.tagline}
          </p>
        </div>

        {/* Nav links */}
        <div className="flex items-center justify-center gap-6 mb-8 flex-wrap">
          {[
            { href: "/translate", label: tr.nav.documents },
            { href: "/text",      label: tr.nav.text      },
            { href: "/history",   label: tr.nav.history   },
            { href: "/dashboard", label: tr.nav.dashboard },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-cosmos-dust/60 hover:text-cosmos-dust transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-cosmos-purple-bright/10 mb-6" />

        {/* Legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cosmos-dust/40">
          <p>© {year} Orbit. {tr.footer.copyright}</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-cosmos-dust/70 transition-colors">
              {tr.footer.privacy}
            </Link>
            <Link href="/terms" className="hover:text-cosmos-dust/70 transition-colors">
              {tr.footer.terms}
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
