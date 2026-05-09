"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    // Auto sign in after account creation
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (result?.error) {
      setError("Account created but sign-in failed. Please sign in manually.");
      router.push("/signin");
    } else {
      router.push(result?.url ?? "/dashboard");
    }
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
          <h1 className="mt-6 text-2xl font-bold text-cosmos-star font-display">Create your account</h1>
          <p className="mt-2 text-cosmos-dust text-sm">Start translating documents for free</p>
        </div>

        <div className="glass-card rounded-2xl p-8 shadow-cosmic">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-cosmos-dust mb-1.5">
                Name <span className="text-cosmos-dust/40">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-xl bg-cosmos-nebula/50 border border-cosmos-purple-bright/20 text-cosmos-star placeholder:text-cosmos-dust/40 focus:outline-none focus:border-cosmos-purple-bright/60 focus:ring-1 focus:ring-cosmos-purple-bright/40 transition-colors text-sm"
              />
            </div>

            {/* Email */}
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

            {/* Password */}
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
                  placeholder="Min. 8 characters"
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

            {/* Confirm */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-cosmos-dust mb-1.5">
                Confirm password
              </label>
              <input
                id="confirm"
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-cosmos-nebula/50 border border-cosmos-purple-bright/20 text-cosmos-star placeholder:text-cosmos-dust/40 focus:outline-none focus:border-cosmos-purple-bright/60 focus:ring-1 focus:ring-cosmos-purple-bright/40 transition-colors text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-cosmos-dust/60">
          Already have an account?{" "}
          <Link href="/signin" className="text-cosmos-purple-light hover:text-cosmos-star underline transition-colors">
            Sign in
          </Link>
        </p>

        <p className="text-center mt-3 text-xs text-cosmos-dust/40">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline hover:text-cosmos-dust">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-cosmos-dust">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
