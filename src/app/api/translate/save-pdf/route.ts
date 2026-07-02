import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";
import { checkTranslationQuota, PLAN_LIMITS } from "@/lib/quota";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const filename = (formData.get("filename") as string) || "document.pdf";
  const charCount = parseInt((formData.get("charCount") as string) || "0", 10);

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const userId = session.user.id;

  // Check translation quota based on plan
  const quota = await checkTranslationQuota(userId);
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.error ?? "Translation limit reached" }, { status: 402 });
  }

  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userId}/${timestamp}_${safeName}_mongolian.pdf`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadFile(buffer, storagePath, "application/pdf");

  const translation = await prisma.translation.create({
    data: {
      userId,
      originalFileName: filename,
      // client-side pipeline — no separate original stored
      originalFilePath: storagePath,
      translatedFilePath: storagePath,
      fileType: "pdf",
      outputFormat: "pdf",
      charCount,
      status: "DONE",
      completedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Guard against two parallel saves both passing the count check (TOCTOU)
  if (!quota.isAdmin) {
    const recheck = await checkTranslationQuota(userId);
    if (recheck.dailyCount > PLAN_LIMITS[recheck.plan].daily) {
      await prisma.translation.delete({ where: { id: translation.id } });
      return NextResponse.json({ error: "Translation limit reached" }, { status: 402 });
    }
  }

  return NextResponse.json({ translationId: translation.id });
}
