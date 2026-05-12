"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Layers, History, LogOut, User, ChevronDown, Zap, Type } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { lang, toggle } = useLanguage();
  const tr = t[lang];

  const NAV_LINKS = [
    { href: "/translate", icon: Layers,  label: tr.nav.documents },
    { href: "/text",      icon: Type,    label: tr.nav.text      },
    { href: "/history",   icon: History, label: tr.nav.history   },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-cosmos-purple-bright/10 bg-cosmos-black/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <Image
                src="/images/orbit-logo.png"
                alt="Orbit"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="font-display font-bold text-xl text-cosmos-star tracking-tight">
                Orbit
              </span>
            </Link>

            {/* Desktop nav links */}
            {session && (
              <div className="hidden md:flex items-center gap-1">
                {NAV_LINKS.map(({ href, icon: Icon, label }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 active:scale-95 active:opacity-70",
                        active
                          ? "bg-cosmos-purple-bright/15 text-cosmos-purple-light border border-cosmos-purple-bright/25"
                          : "text-cosmos-dust hover:text-cosmos-star hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <Icon size={15} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-2">

              {/* Language toggle */}
              <button
                onClick={toggle}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-cosmos-purple-bright/20 text-cosmos-dust hover:text-cosmos-star hover:border-cosmos-purple-bright/40 hover:bg-white/5 active:scale-95 transition-all duration-150"
                title={lang === "en" ? "Switch to Mongolian" : "Switch to English"}
              >
                <span className="text-base leading-none">{lang === "en" ? "🇲🇳" : "🇬🇧"}</span>
                <span className="hidden sm:inline">{lang === "en" ? "MN" : "EN"}</span>
              </button>

              {session ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 active:opacity-70 transition-all duration-150 text-sm text-cosmos-dust hover:text-cosmos-star"
                  >
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt="avatar"
                        className="w-7 h-7 rounded-full border border-cosmos-purple-bright/30"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-cosmos-purple-dark flex items-center justify-center">
                        <User size={14} />
                      </div>
                    )}
                    <span className="hidden sm:block max-w-[120px] truncate">
                      {session.user?.name ?? session.user?.email}
                    </span>
                    <ChevronDown size={14} className={cn("transition-transform duration-150", menuOpen && "rotate-180")} />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl overflow-hidden shadow-cosmic border border-cosmos-purple-bright/20 z-50">
                      <div className="px-3 py-2 border-b border-cosmos-purple-bright/10">
                        <p className="text-xs text-cosmos-dust truncate">{session.user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-cosmos-dust hover:text-cosmos-star hover:bg-white/5 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Zap size={14} /> {tr.nav.dashboard}
                      </Link>
                      <button
                        onClick={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={14} /> {tr.nav.signOut}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/signin">
                    <Button variant="ghost" size="sm">{tr.nav.signIn}</Button>
                  </Link>
                  <Link href="/signin">
                    <Button size="sm">{tr.nav.getStarted}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      {session && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-cosmos-purple-bright/10 bg-cosmos-black/80 backdrop-blur-xl">
          <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
            {NAV_LINKS.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 active:scale-90 active:opacity-60",
                    active
                      ? "text-cosmos-purple-light"
                      : "text-cosmos-dust/60 hover:text-cosmos-dust"
                  )}
                >
                  <Icon size={20} className={active ? "text-cosmos-purple-light" : ""} />
                  {label}
                  {active && (
                    <span className="w-1 h-1 rounded-full bg-cosmos-purple-bright" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
