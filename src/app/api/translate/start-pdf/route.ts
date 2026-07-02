import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkTranslationQuota } from "@/lib/quota";
import { issuePdfToken } from "@/lib/pdf-session";

export const dynamic = "force-dynamic";

// Called by the client-side PDF pipeline BEFORE any translation work.
// Checks the document quota up front (previously it was only checked at
// save time — after all the OpenAI spend) and issues a short-lived token
// that authorizes the pipeline's internal text/cleanup calls.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quota = await checkTranslationQuota(session.user.id);
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.error ?? "Translation limit reached" }, { status: 402 });
  }

  return NextResponse.json({ token: issuePdfToken(session.user.id) });
}
