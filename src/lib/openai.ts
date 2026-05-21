import OpenAI from "openai";

// Lazy singleton — avoids throwing at build time when env var isn't set
let _openai: OpenAI | null = null;
export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}
// Keep named export for backwards compat — resolved at call time
export const openai = new Proxy({} as OpenAI, {
  get(_t, prop) {
    return (getOpenAI() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const TRANSLATION_MODEL = "gpt-5.4-mini";

export const FREE_CHARS_PER_MONTH = 15_000;
export const CHARS_PER_TOPUP_UNIT = 1_000;
export const TOPUP_PRICE_CENTS = 10; // $0.10 per 1000 chars
export const PRO_MONTHLY_PRICE_CENTS = 1000; // $10/mo
export const PRO_MONTHLY_CHARS = 500_000;

export function buildTranslationPrompt(
  textChunk: string,
  contextSummary: string,
  detectedLanguage: string,
  targetLanguage = "Mongolian",
  translateTerms?: string[]
): string {
  const termOverride = translateTerms?.length
    ? `\n9. OVERRIDE — translate these specific terms into ${targetLanguage} even if they would normally be kept as-is: ${translateTerms.join(", ")}`
    : "";

  return `You are a professional translator specializing in translating documents into ${targetLanguage}.

RULES — follow exactly:
1. Translate ALL body text into fluent, natural ${targetLanguage}.
2. NEVER translate proper nouns: geographic names, brand names (Google, iPhone, Microsoft, Toyota), personal names, organization names, and product names. Keep them exactly as written in the source.
3. NEVER translate technical identifiers: URLs, email addresses, file paths, code snippets, chemical formulas, mathematical expressions, model numbers.
4. Maintain the EXACT same tone and register as the source (formal stays formal, casual stays casual, technical stays technical, legal stays legal).
5. Preserve ALL formatting markers exactly as written — output them verbatim, never translate or modify them: [IMG_1], [TABLE_1], [TABLE_1_ROW_0_COL_0], [CODE_1], [PAGEBREAK], etc.
6. Use the previously translated content in <context> to maintain consistent terminology.
7. Output ONLY the translated text with preserved markers. No explanations, notes, or commentary.
8. Numbers, dates, and measurements: translate surrounding text but keep numerals and units as-is.${termOverride}

<context>
${contextSummary || "No previous context — this is the beginning of the document."}
</context>

<source_language>${detectedLanguage || "auto-detect"}</source_language>

Translate the following text to ${targetLanguage}:

${textChunk}`;
}
