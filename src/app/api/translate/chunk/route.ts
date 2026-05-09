import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, downloadFile } from "@/lib/storage";
import { translateChunk, buildContextSummary } from "@/lib/translator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface JobData {
  ext: string;
  outputFormat: string;
  userId: string;
  blocks: unknown[];
  chunks: { text: string }[];
  translatedChunks: string[];
  contextSummary: string;
  lang: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { translationId, chunkIndex } = await req.json();
  if (!translationId || chunkIndex === undefined) {
    return NextResponse.json({ error: "Missing translationId or chunkIndex" }, { status: 400 });
  }

  const translation = await prisma.translation.findUnique({
    where: { id: translationId, userId: session.user.id },
  });

  if (!translation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (translation.status === "FAILED") return NextResponse.json({ error: "Translation failed" }, { status: 409 });

  // Load job data from storage (jobPath stored in errorMessage temporarily)
  const jobPath = translation.errorMessage!;
  const jobBuffer = await downloadFile(jobPath);
  const job: JobData = JSON.parse(jobBuffer.toString());

  const totalChunks = job.chunks.length;

  if (chunkIndex >= totalChunks) {
    return NextResponse.json({ error: "Invalid chunk index" }, { status: 400 });
  }

  // Translate this chunk
  const chunkText = job.chunks[chunkIndex].text;
  const translated = await translateChunk(chunkText, job.contextSummary);

  // Update job data with translated chunk and new context
  job.translatedChunks[chunkIndex] = translated;
  job.contextSummary = buildContextSummary(translated, job.contextSummary);

  const isLastChunk = chunkIndex === totalChunks - 1;

  if (isLastChunk) {
    // All chunks done — rebuild document
    try {
      const fullTranslated = job.translatedChunks.join("\n");
      let translatedBuffer: Buffer;

      if (job.ext === "pdf") {
        const { extractPdf, buildPdf, parsePdfTranslatedOutput } = await import("@/lib/pdf-processor");
        const originalBuffer = await downloadFile(translation.originalFilePath);
        const extracted = await extractPdf(originalBuffer);
        const translatedMap = parsePdfTranslatedOutput(fullTranslated, extracted.blocks.length);

        if (job.outputFormat === "pdf") {
          translatedBuffer = await buildPdf(extracted.blocks, translatedMap);
        } else {
          const { Document, Packer, Paragraph, TextRun } = await import("docx");
          const paragraphs = Array.from(translatedMap.values()).map(
            (text) => new Paragraph({ children: [new TextRun({ text })] })
          );
          const doc = new Document({ sections: [{ children: paragraphs }] });
          translatedBuffer = await Packer.toBuffer(doc);
        }
      } else {
        const { extractDocx, buildDocx, parseTranslatedOutput } = await import("@/lib/docx-processor");
        const originalBuffer = await downloadFile(translation.originalFilePath);
        const extracted = await extractDocx(originalBuffer);
        const translatedMap = parseTranslatedOutput(fullTranslated, extracted.blocks.length);

        if (job.outputFormat === "docx") {
          translatedBuffer = await buildDocx(extracted.blocks, translatedMap);
        } else {
          const { buildPdf } = await import("@/lib/pdf-processor");
          // Convert block map to pdf blocks format
          const pdfBlocks = extracted.blocks.map((b: unknown, i: number) => ({
            type: "text" as const,
            text: (b as { text?: string }).text ?? "",
            pageIndex: 0,
            blockIndex: i,
          }));
          translatedBuffer = await buildPdf(pdfBlocks, translatedMap);
        }
      }

      const translatedPath = `${job.userId}/${Date.now()}_translated.${job.outputFormat}`;
      const mime = job.outputFormat === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      await uploadFile(translatedBuffer, translatedPath, mime);

      await prisma.translation.update({
        where: { id: translationId },
        data: {
          status: "DONE",
          translatedFilePath: translatedPath,
          completedAt: new Date(),
          errorMessage: null, // clear the temp jobPath
        },
      });

      return NextResponse.json({
        chunkIndex,
        totalChunks,
        done: true,
        downloadUrl: `/api/download/${translationId}`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Build failed";
      await prisma.translation.update({
        where: { id: translationId },
        data: { status: "FAILED", errorMessage: message },
      });
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Save updated job data back to storage
  await uploadFile(Buffer.from(JSON.stringify(job)), jobPath, "application/json");

  return NextResponse.json({
    chunkIndex,
    totalChunks,
    done: false,
  });
}
