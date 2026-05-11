import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Verify the request comes from Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const old = await prisma.translation.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true, originalFilePath: true, translatedFilePath: true, errorMessage: true },
  });

  let deleted = 0;
  let errors = 0;

  for (const t of old) {
    // Delete original file
    if (t.originalFilePath) {
      try { await deleteFile(t.originalFilePath); } catch { errors++; }
    }
    // Delete translated file
    if (t.translatedFilePath) {
      try { await deleteFile(t.translatedFilePath); } catch { errors++; }
    }
    // Delete job JSON (stored in errorMessage field during processing)
    if (t.errorMessage?.includes("/jobs/")) {
      try { await deleteFile(t.errorMessage); } catch { /* already gone */ }
    }
  }

  // Delete DB records after files are gone
  const { count } = await prisma.translation.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  deleted = count;

  return NextResponse.json({ deleted, errors, cutoff });
}
