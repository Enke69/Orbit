import { Navbar } from "@/components/layout/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </>
  );
}
