import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";
import { isAllowedFileType, getCurrentMonth } from "@/lib/utils";
import { FREE_CHARS_PER_MONTH } from "@/lib/openai";
import { extractDocx } from "@/lib/docx-processor";
import { extractPdf } from "@/lib/pdf-processor";
import { chunkTranslatableText, detectLanguage } from "@/lib/translator";
import { addDays } from "date-fns";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const outputFormat = (formData.get("outputFormat") as string) ?? "pdf";
  const targetLanguage = (formData.get("targetLanguage") as string) ?? "Mongolian";
  let translateTerms: string[] = [];
  try {
    const raw = formData.get("translateTerms") as string | null;
    if (raw) translateTerms = JSON.parse(raw);
  } catch { /* ignore malformed */ }

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!isAllowedFileType(file.name)) return NextResponse.json({ error: "Unsupported file type. Use PDF, DOC, or DOCX." }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "File too large. Maximum 50 MB." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "docx";

  // Extract text and split into chunks
  let extracted: { translatable: string; charCount: number; blocks: unknown[] };
  try {
    if (ext === "pdf") {
      extracted = await extractPdf(buffer) as typeof extracted;
    } else {
      extracted = await extractDocx(buffer) as typeof extracted;
    }
  } catch (err) {
    console.error("File extraction error:", err);
    return NextResponse.json({ error: "Could not read file. Make sure it is a valid PDF or Word document." }, { status: 422 });
  }

  // Check if user is admin (infinite credits)
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  const isAdmin = adminEmails.includes(session.user.email ?? "");

  // Check quota (skipped for admins)
  const month = getCurrentMonth();
  if (!isAdmin) {
    const usage = await prisma.monthlyUsage.findUnique({ where: { userId_month: { userId, month } } });
    const charsUsed = usage?.charsUsed ?? 0;
    const charsPaid = usage?.charsPaid ?? 0;
    const remaining = FREE_CHARS_PER_MONTH + charsPaid - charsUsed;

    if (extracted.charCount > remaining) {
      return NextResponse.json({ error: "Character limit exceeded", required: extracted.charCount, remaining }, { status: 402 });
    }
  }

  // Upload original file
  const originalPath = `${userId}/${Date.now()}_original_${file.name}`;
  await uploadFile(buffer, originalPath, file.type || "application/octet-stream");

  // Split into chunks and detect language
  const chunks = chunkTranslatableText(extracted.translatable);
  const lang = await detectLanguage(extracted.translatable.slice(0, 500));

  // Save chunk job data to storage so the chunk route can access it
  const jobData = {
    ext,
    outputFormat,
    userId,
    blocks: extracted.blocks,
    chunks: chunks.map((c) => ({ text: c.text })),
    translatedChunks: [] as string[],
    contextSummary: "",
    lang,
    targetLanguage,
    translateTerms,
  };
  const jobPath = `${userId}/jobs/${Date.now()}_job.json`;
  await uploadFile(Buffer.from(JSON.stringify(jobData)), jobPath, "application/json");

  // Create DB record
  const translation = await prisma.translation.create({
    data: {
      userId,
      originalFileName: file.name,
      originalFilePath: originalPath,
      fileType: ext,
      sourceLanguage: lang,
      charCount: extracted.charCount,
      status: "PROCESSING",
      outputFormat,
      expiresAt: addDays(new Date(), 7),
      // store jobPath in errorMessage field temporarily (reuse existing column)
      errorMessage: jobPath,
    },
  });

  // Deduct usage (skipped for admins)
  if (!isAdmin) {
    await prisma.monthlyUsage.upsert({
      where: { userId_month: { userId, month } },
      update: { charsUsed: { increment: extracted.charCount } },
      create: { userId, month, charsUsed: extracted.charCount },
    });
  }

  return NextResponse.json({
    translationId: translation.id,
    totalChunks: chunks.length,
    sourceLanguage: lang,
  });
}
