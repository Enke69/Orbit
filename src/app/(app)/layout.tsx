import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-16 pb-16 md:pb-0 min-h-screen">
        {children}
      </main>
      <div className="pb-16 md:pb-0">
        <Footer />
      </div>
    </>
  );
}
