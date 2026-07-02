import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TRANSLATION_MODEL, getOpenAI, formatGlossary, type GlossaryEntry } from "@/lib/openai";
import { checkTextQuota, recordTextUsage } from "@/lib/quota";
import { verifyPdfToken } from "@/lib/pdf-session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function buildSystemPrompt(targetLanguage: string, translateTerms?: string[], glossary?: GlossaryEntry[]): string {
  const termOverride = translateTerms?.length
    ? `\n7. OVERRIDE — translate these specific terms into ${targetLanguage} even if they would normally be kept as named entities: ${translateTerms.join(", ")}`
    : "";

  return `You are a professional document translator.
Your ONLY task: translate EVERY numbered line into ${targetLanguage}.

OUTPUT FORMAT (mandatory):
N|||translated text
— One line per input line, same number, ||| separator, nothing else.

RULES:
1. Output EXACTLY one result line per input line. Never skip a number, never merge lines.
2. Translate ALL text into natural, fluent ${targetLanguage} — including section headings, titles, and descriptive phrases.
3. Do NOT translate: specific named entities (person names, place names, brand names, product names), URLs, citation markers like [1], code snippets, numbers, formulas, or units.
4. Generic descriptive phrases and section titles MUST be translated even if they sound technical.
5. A line ending with a hyphen (-) is a word broken across lines — translate just that fragment, keep the hyphen.
6. Do NOT add explanations, markdown, notes, or commentary of any kind.${termOverride}${formatGlossary(glossary)}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const {
    lines,
    contextSummary = "",
    targetLanguage = "Mongolian",
    translateTerms,
    internal,
    pdfToken,
    glossary,
  } = (await req.json()) as {
    lines: string[];
    contextSummary?: string;
    targetLanguage?: string;
    translateTerms?: string[];
    internal?: boolean;
    pdfToken?: string;
    glossary?: GlossaryEntry[];
  };

  if (!lines?.length) {
    return NextResponse.json({ translated: [], newContext: contextSummary });
  }

  const totalChars = lines.reduce((s, l) => s + l.length, 0);

  if (internal) {
    // Internal calls (PDF pipeline) bypass the text quota because the whole
    // document is gated by the document quota — but only with a valid token
    // issued by /api/translate/start-pdf. Without this check, anyone could
    // set internal:true and translate unlimited text for free.
    if (!verifyPdfToken(pdfToken, userId)) {
      return NextResponse.json({ error: "Invalid or expired translation session" }, { status: 403 });
    }
  } else {
    const quota = await checkTextQuota(userId, totalChars);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error ?? "Text translation limit reached" }, { status: 402 });
    }
  }

  const input = lines.map((l, i) => `${i + 1}|||${l}`).join("\n");
  const contextPart = contextSummary ? `\n\nPrevious context:\n${contextSummary}` : "";

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: TRANSLATION_MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt(targetLanguage, translateTerms, glossary) },
      { role: "user", content: input + contextPart },
    ],
    temperature: 0.1,
    // Cyrillic output is token-heavy; plan limits allow up to 20k chars input
    max_completion_tokens: 16384,
  });

  const raw = response.choices[0]?.message?.content ?? "";

  const map: Record<number, string> = {};
  for (const line of raw.split("\n")) {
    const m = line.trim().match(/^(\d+)\s*\|\|\|\s*(.*)/);
    if (m) map[parseInt(m[1])] = m[2].trimEnd();
  }

  const translated = lines.map((l, i) => {
    const t = map[i + 1];
    if (!t?.trim()) return null;
    if (t.trim() === l.trim()) return null;
    return t;
  });

  const newContext = translated
    .filter(Boolean)
    .slice(-5)
    .join(" ")
    .slice(-500);

  // Record usage for non-internal calls only
  if (!internal) {
    await recordTextUsage(userId);
  }

  return NextResponse.json({ translated, newContext });
}
