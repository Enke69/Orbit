import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { StarBackground } from "@/components/ui/StarBackground";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Both fonts include Cyrillic — required for Mongolian UI text.
// (The previous display font, Outfit, has no Cyrillic subset, so Mongolian
// headings silently fell back to system-ui.)
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  icons: { icon: "/images/orbit-logo.png" },
  title: "Orbit — AI Document Translation",
  description: "Upload any PDF or Word document and get a professional translation in minutes. Powered by AI.",
  keywords: ["AI translation", "document translation", "PDF translation", "орчуулга"],
  openGraph: {
    title: "Orbit — AI Document Translation",
    description: "Professional AI-powered document translation",
    siteName: "Orbit",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" suppressHydrationWarning className={`${inter.variable} ${manrope.variable}`}>
      <body className="antialiased">
        <SessionProvider>
          <LanguageProvider>
          <StarBackground />
          <div className="relative z-10 min-h-screen">
            {children}
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1a1a3e",
                color: "#f8fafc",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#7c3aed", secondary: "#f8fafc" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#f8fafc" },
              },
            }}
          />
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
