import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOpenAI, TRANSLATION_MODEL, formatGlossary, type GlossaryEntry } from "@/lib/openai";
import { verifyPdfToken } from "@/lib/pdf-session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { original, translated, targetLanguage = "Mongolian", pdfToken, glossary } = (await req.json()) as {
    original: string[];
    translated: (string | null)[];
    targetLanguage: string;
    pdfToken?: string;
    glossary?: GlossaryEntry[];
  };

  // Only the PDF pipeline uses this route; require its session token so the
  // endpoint can't be scripted as a free translation API
  if (!verifyPdfToken(pdfToken, session.user.id)) {
    return NextResponse.json({ error: "Invalid or expired translation session" }, { status: 403 });
  }

  if (!original?.length) return NextResponse.json({ lines: translated ?? [] });

  // Build combined input: each line shows original + current translation
  const input = original
    .map((orig, i) => {
      const curr = translated[i];
      const currStr =
        curr !== null && curr !== undefined && curr !== ""
          ? curr
          : "[NOT TRANSLATED]";
      return `${i + 1}|||ORIG: ${orig}|||CURR: ${currStr}`;
    })
    .join("\n");

  const openai = getOpenAI();
  try {
    const response = await openai.chat.completions.create({
      model: TRANSLATION_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a ${targetLanguage} translation quality reviewer for a PDF document.

Each input line has: line number, ORIG (source text), and CURR (current translation or [NOT TRANSLATED]).

Your job — return a corrected ${targetLanguage} translation for EVERY line:
1. If CURR is already fluent ${targetLanguage}: return it with at most minor fixes
2. If CURR is [NOT TRANSLATED] or still contains English words: translate ORIG into ${targetLanguage}
3. Use surrounding lines for full sentence context — sentences often split across adjacent lines
4. Keep proper nouns, brand names, numbers, URLs, and code unchanged
5. Ensure consistent terminology throughout the whole page${formatGlossary(glossary)}

OUTPUT FORMAT (mandatory):
N|||corrected text
One result line per input line, same N, ||| separator, nothing else.`,
        },
        { role: "user", content: input },
      ],
      temperature: 0.1,
      max_completion_tokens: 8192,
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const map: Record<number, string> = {};
    for (const line of raw.split("\n")) {
      const m = line.trim().match(/^(\d+)\s*\|\|\|\s*(.*)/);
      if (m) map[parseInt(m[1])] = m[2].trimEnd();
    }

    const lines = original.map((_, i) => {
      const cleaned = map[i + 1];
      // If cleanup returned empty or nothing, keep existing translation
      if (!cleaned?.trim()) return translated[i];
      return cleaned;
    });

    return NextResponse.json({ lines });
  } catch {
    // Non-critical — return original translation on any error
    return NextResponse.json({ lines: translated });
  }
}
