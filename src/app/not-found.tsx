import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl font-display font-bold bg-gradient-to-b from-cosmos-purple-light to-cosmos-purple-dark bg-clip-text text-transparent mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-cosmos-star mb-2">Page not found</h1>
      <p className="text-cosmos-dust mb-8">This page drifted out of orbit.</p>
      <Link href="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
