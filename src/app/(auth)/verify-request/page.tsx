import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-cosmos-purple-bright/15 border border-cosmos-purple-bright/30 flex items-center justify-center mx-auto mb-6">
          <Mail size={28} className="text-cosmos-purple-light" />
        </div>
        <h1 className="text-2xl font-bold text-cosmos-star font-display mb-3">Check your email</h1>
        <p className="text-cosmos-dust mb-6">
          A sign-in link has been sent to your email address. Click the link to continue to Orbit.
        </p>
        <Link href="/signin" className="text-sm text-cosmos-purple-light hover:text-cosmos-purple-glow underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
