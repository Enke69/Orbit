"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Layers, History, LogOut, User, ChevronDown, Zap } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-cosmos-purple-bright/10 bg-cosmos-black/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full bg-cosmos-purple-bright/20 group-hover:bg-cosmos-purple-bright/30 transition-colors" />
              <div className="absolute inset-1 rounded-full border border-cosmos-purple-bright/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-cosmos-purple-bright shadow-nebula" />
              </div>
            </div>
            <span className="font-display font-bold text-xl text-cosmos-star tracking-tight">
              Orbit
            </span>
          </Link>

          {/* Nav links */}
          {session && (
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/translate" icon={<Layers size={15} />}>Translate</NavLink>
              <NavLink href="/history" icon={<History size={15} />}>History</NavLink>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors text-sm text-cosmos-dust hover:text-cosmos-star"
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
                  <ChevronDown size={14} className={cn("transition-transform", menuOpen && "rotate-180")} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl overflow-hidden shadow-cosmic border border-cosmos-purple-bright/20">
                    <div className="px-3 py-2 border-b border-cosmos-purple-bright/10">
                      <p className="text-xs text-cosmos-dust truncate">{session.user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-cosmos-dust hover:text-cosmos-star hover:bg-white/5 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Zap size={14} /> Dashboard
                    </Link>
                    <button
                      onClick={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/signin">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-cosmos-dust hover:text-cosmos-star hover:bg-white/5 transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
