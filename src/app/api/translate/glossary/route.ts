import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractGlossary } from "@/lib/translator";
import { verifyPdfToken } from "@/lib/pdf-session";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Called by the PDF pipeline after the first page finishes: extracts the
// term renderings used so far so later pages stay terminologically consistent.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { original, translated, targetLanguage = "Mongolian", pdfToken } = (await req.json()) as {
    original: string[];
    translated: (string | null)[];
    targetLanguage?: string;
    pdfToken?: string;
  };

  if (!verifyPdfToken(pdfToken, session.user.id)) {
    return NextResponse.json({ error: "Invalid or expired translation session" }, { status: 403 });
  }

  if (!original?.length) return NextResponse.json({ glossary: [] });

  const sourceText = original.join("\n");
  const translatedText = (translated ?? []).filter(Boolean).join("\n");
  if (!translatedText.trim()) return NextResponse.json({ glossary: [] });

  const glossary = await extractGlossary(sourceText, translatedText, targetLanguage);
  return NextResponse.json({ glossary });
}
