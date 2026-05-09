import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  icons: { icon: "/favicon.svg" },
  title: "Orbit — AI Document Translation to Mongolian",
  description: "Upload any PDF or Word document and get a professional Mongolian translation in minutes. Powered by GPT-5.4 mini.",
  keywords: ["Mongolian translation", "AI translation", "document translation", "PDF translation", "орчуулга"],
  openGraph: {
    title: "Orbit — AI Document Translation",
    description: "Professional AI-powered document translation to Mongolian",
    siteName: "Orbit",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <body className="antialiased">
        <SessionProvider>
          <div className="stars-bg" aria-hidden="true" />
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
        </SessionProvider>
      </body>
    </html>
  );
}
