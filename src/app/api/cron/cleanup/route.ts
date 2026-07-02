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

  // Mark orphaned jobs (client closed mid-translation, route timed out) as
  // FAILED so they stop counting against the user's quota
  const staleCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const { count: staleCount } = await prisma.translation.updateMany({
    where: { status: { in: ["PENDING", "PROCESSING"] }, createdAt: { lt: staleCutoff } },
    data: { status: "FAILED" },
  });

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

  return NextResponse.json({ deleted, staleMarkedFailed: staleCount, errors, cutoff });
}
