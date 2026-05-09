import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-cosmos-star font-display mb-3">Authentication error</h1>
        <p className="text-cosmos-dust mb-6">
          Something went wrong during sign in. The link may have expired or already been used.
        </p>
        <Link href="/signin">
          <Button>Try again</Button>
        </Link>
      </div>
    </div>
  );
}
