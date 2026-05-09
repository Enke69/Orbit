"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Mail, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

type Tab = "password" | "magic";

export default function SignInPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState<"google" | "submit" | null>(null);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setLoading("google");
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading("submit");
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });
    setLoading(null);
    if (result?.error) {
      setError("Incorrect email or password.");
    } else {
      router.push(result?.url ?? "/dashboard");
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading("submit");
    await signIn("resend", { email, callbackUrl: "/dashboard", redirect: false });
    setEmailSent(true);
    setLoading(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cosmos-purple-bright/8 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full bg-cosmos-purple-bright/20" />
              <div className="absolute inset-1.5 rounded-full border border-cosmos-purple-bright/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-cosmos-purple-bright shadow-nebula" />
              </div>
            </div>
            <span className="font-display font-bold text-2xl text-cosmos-star">Orbit</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-cosmos-star font-display">Welcome back</h1>
          <p className="mt-2 text-cosmos-dust text-sm">Sign in to start translating documents</p>
        </div>

        <div className="glass-card rounded-2xl p-8 shadow-cosmic">
          {/* Google */}
          <Button
            variant="outline"
            className="w-full mb-6 gap-3"
            size="lg"
            onClick={handleGoogle}
            loading={loading === "google"}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          {/* Tabs */}
          <div className="flex rounded-xl bg-cosmos-nebula/40 p-1 mb-6 border border-cosmos-purple-bright/10">
            <button
              onClick={() => { setTab("password"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === "password"
                  ? "bg-cosmos-purple-bright/20 text-cosmos-star"
                  : "text-cosmos-dust hover:text-cosmos-star"
              }`}
            >
              Password
            </button>
            <button
              onClick={() => { setTab("magic"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === "magic"
                  ? "bg-cosmos-purple-bright/20 text-cosmos-star"
                  : "text-cosmos-dust hover:text-cosmos-star"
              }`}
            >
              Magic link
            </button>
          </div>

          {tab === "password" ? (
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-cosmos-dust mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-cosmos-nebula/50 border border-cosmos-purple-bright/20 text-cosmos-star placeholder:text-cosmos-dust/40 focus:outline-none focus:border-cosmos-purple-bright/60 focus:ring-1 focus:ring-cosmos-purple-bright/40 transition-colors text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-cosmos-dust mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    className="w-full px-4 py-2.5 pr-11 rounded-xl bg-cosmos-nebula/50 border border-cosmos-purple-bright/20 text-cosmos-star placeholder:text-cosmos-dust/40 focus:outline-none focus:border-cosmos-purple-bright/60 focus:ring-1 focus:ring-cosmos-purple-bright/40 transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cosmos-dust/50 hover:text-cosmos-dust transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" loading={loading === "submit"}>
                Sign in
              </Button>
            </form>
          ) : emailSent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-cosmos-purple-bright/15 border border-cosmos-purple-bright/30 flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-cosmos-purple-light" />
              </div>
              <h2 className="text-lg font-semibold text-cosmos-star mb-2">Check your inbox</h2>
              <p className="text-sm text-cosmos-dust">
                We sent a sign-in link to <span className="text-cosmos-purple-light">{email}</span>.
                Click the link to continue.
              </p>
              <button
                onClick={() => { setEmailSent(false); setEmail(""); }}
                className="mt-4 text-xs text-cosmos-dust hover:text-cosmos-star underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="magic-email" className="block text-sm font-medium text-cosmos-dust mb-1.5">
                  Email address
                </label>
                <input
                  id="magic-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-cosmos-nebula/50 border border-cosmos-purple-bright/20 text-cosmos-star placeholder:text-cosmos-dust/40 focus:outline-none focus:border-cosmos-purple-bright/60 focus:ring-1 focus:ring-cosmos-purple-bright/40 transition-colors text-sm"
                />
              </div>
              <Button type="submit" className="w-full gap-2" size="lg" loading={loading === "submit"}>
                <Mail size={16} />
                Send magic link
              </Button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-cosmos-dust/60">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-cosmos-purple-light hover:text-cosmos-star underline transition-colors">
            Sign up
          </Link>
        </p>

        <p className="text-center mt-3 text-xs text-cosmos-dust/40">
          By signing in you agree to our{" "}
          <Link href="/terms" className="underline hover:text-cosmos-dust">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-cosmos-dust">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
