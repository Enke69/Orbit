import { openai, TRANSLATION_MODEL, buildTranslationPrompt } from "./openai";

const MAX_CHARS_PER_CHUNK = 3_000; // well within gpt-5.4-mini context

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
  targetLanguage = "Mongolian"
): Promise<string> {
  const prompt = buildTranslationPrompt(text, contextSummary, "auto-detect", targetLanguage);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: TRANSLATION_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_completion_tokens: 4096,
      });

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
