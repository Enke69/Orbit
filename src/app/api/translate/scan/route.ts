import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOpenAI, TRANSLATION_MODEL } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ terms: [] });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  let text = "";

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (ext === "docx" || ext === "doc") {
      const { extractDocx } = await import("@/lib/docx-processor");
      const extracted = await extractDocx(buffer);
      text = extracted.translatable.slice(0, 4000);
    }
  } catch {
    return NextResponse.json({ terms: [] });
  }

  if (!text.trim()) return NextResponse.json({ terms: [] });

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: TRANSLATION_MODEL,
      messages: [
        {
          role: "user",
          content: `Identify technical terms, acronyms, abbreviations, and domain-specific jargon in the text below that a user might want to decide whether to translate or keep in the original language.\n\nReturn ONLY a valid JSON array of strings, no markdown: ["term1", "term2", ...]\nRules: max 15 unique terms, only specialized/technical terms, no common everyday words.\n\nText:\n${text}`,
        },
      ],
      temperature: 0,
      max_completion_tokens: 300,
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return NextResponse.json({ terms: [] });

    const parsed: unknown = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return NextResponse.json({ terms: [] });

    const terms = parsed
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .slice(0, 15);

    return NextResponse.json({ terms });
  } catch {
    return NextResponse.json({ terms: [] });
  }
}
