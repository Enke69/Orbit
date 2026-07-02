import { createHmac, timingSafeEqual } from "crypto";

// Short-lived HMAC token proving the user passed the document-quota check
// before starting a client-side PDF translation. The PDF pipeline calls
// /api/translate/text and /api/translate/cleanup many times with
// `internal: true` (which bypasses the per-request text quota) — without this
// token, anyone could set that flag manually and translate unlimited text
// for free.

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2h — enough for very large PDFs

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return s;
}

function sign(userId: string, exp: number): string {
  return createHmac("sha256", secret()).update(`pdf.${userId}.${exp}`).digest("hex");
}

export function issuePdfToken(userId: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  return `${exp}.${sign(userId, exp)}`;
}

export function verifyPdfToken(token: string | undefined | null, userId: string): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = parseInt(token.slice(0, dot), 10);
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = sign(userId, exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
