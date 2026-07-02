import { openai, TRANSLATION_MODEL, buildTranslationPrompt, type GlossaryEntry } from "./openai";

// Larger chunks = fewer round-trips (faster, cheaper, more context per call).
// Kept moderate so worst-case Cyrillic output still generates well inside the
// route's 60s serverless limit.
const MAX_CHARS_PER_CHUNK = 6_000;

interface TranslationChunk {
  text: string;
  startLine: number;
  endLine: number;
}

// Split the translatable text into chunks by line, keeping [BLOCK_N] markers intact
export function chunkTranslatableText(translatable: string): TranslationChunk[] {
  const lines = translatable.split("\n").filter(Boolean);
  const chunks: TranslationChunk[] = [];

  let current = "";
  let startLine = 0;

  lines.forEach((line, i) => {
    if (current.length + line.length > MAX_CHARS_PER_CHUNK && current) {
      chunks.push({ text: current.trim(), startLine, endLine: i - 1 });
      current = line + "\n";
      startLine = i;
    } else {
      current += line + "\n";
    }
  });

  if (current.trim()) {
    chunks.push({ text: current.trim(), startLine, endLine: lines.length - 1 });
  }

  return chunks;
}

// Translate all chunks sequentially, passing rolling context
export async function translateChunks(
  chunks: TranslationChunk[],
  onProgress?: (done: number, total: number) => void
): Promise<string> {
  let contextSummary = "";
  let fullOutput = "";

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const translatedChunk = await translateChunk(chunk.text, contextSummary);
    fullOutput += translatedChunk + "\n";

    // Summarize last 500 chars of output as context for next chunk
    contextSummary = buildContextSummary(translatedChunk, contextSummary);

    onProgress?.(i + 1, chunks.length);
  }

  return fullOutput;
}

export async function translateChunk(
  text: string,
  contextSummary: string,
  retries = 2,
  targetLanguage = "Mongolian",
  translateTerms?: string[],
  glossary?: GlossaryEntry[]
): Promise<string> {
  const prompt = buildTranslationPrompt(text, contextSummary, "auto-detect", targetLanguage, translateTerms, glossary);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: TRANSLATION_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        // Cyrillic output is token-heavy (~2 chars/token) — headroom prevents
        // silent truncation on large chunks
        max_completion_tokens: 16384,
      });

      if (response.choices[0]?.finish_reason === "length") {
        console.warn("[translateChunk] Response hit token limit — output may be truncated");
      }

      return response.choices[0]?.message?.content?.trim() ?? text;
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (attempt === retries) throw error;
      // Exponential backoff
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }

  return text;
}

// Extract key term pairs from the first translated chunk so later chunks
// (and the PDF cleanup pass) can reuse the exact same renderings.
export async function extractGlossary(
  sourceText: string,
  translatedText: string,
  targetLanguage: string
): Promise<GlossaryEntry[]> {
  try {
    const response = await openai.chat.completions.create({
      model: TRANSLATION_MODEL,
      messages: [
        {
          role: "user",
          content: `Below is a source text and its ${targetLanguage} translation. Extract up to 15 key recurring terms (domain terminology, important nouns/phrases likely to reappear later in the document) and the exact ${targetLanguage} rendering used.

Return ONLY a valid JSON array, no markdown:
[{"source": "term in source language", "target": "rendering used in the translation"}, ...]

Rules: only terms that actually appear in BOTH texts; skip proper nouns kept untranslated; skip common everyday words.

<source>
${sourceText.slice(0, 4000)}
</source>

<translation>
${translatedText.slice(0, 4000)}
</translation>`,
        },
      ],
      temperature: 0,
      max_completion_tokens: 800,
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed: unknown = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is GlossaryEntry =>
          typeof e === "object" && e !== null &&
          typeof (e as GlossaryEntry).source === "string" &&
          typeof (e as GlossaryEntry).target === "string" &&
          (e as GlossaryEntry).source.trim().length > 0 &&
          (e as GlossaryEntry).target.trim().length > 0
      )
      .slice(0, 15);
  } catch {
    // Glossary is a quality enhancement — never fail the translation over it
    return [];
  }
}

export function buildContextSummary(latestTranslation: string, previousContext: string): string {
  // Keep last 300 chars of translated output as rolling context
  const combined = previousContext + "\n" + latestTranslation;
  const lines = combined.split("\n").filter(Boolean);
  const lastLines = lines.slice(-8).join("\n");
  return lastLines.slice(-500);
}

// Detect source language (cheap call before full translation)
export async function detectLanguage(sample: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: TRANSLATION_MODEL,
      messages: [
        {
          role: "user",
          content: `Identify the language of this text. Reply with ONLY the language name in English (e.g. "English", "Russian", "Chinese"). Text:\n\n${sample.slice(0, 500)}`,
        },
      ],
      temperature: 0,
      max_completion_tokens: 20,
    });
    return response.choices[0]?.message?.content?.trim() ?? "Unknown";
  } catch {
    return "Unknown";
  }
}
