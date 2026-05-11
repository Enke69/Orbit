# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start local dev server (localhost:3000)
npm run build        # prisma generate + next build
npm run db:push      # Push Prisma schema to database (no migrations)
npm run db:studio    # Open Prisma Studio GUI
npm run db:generate  # Regenerate Prisma client after schema changes
```

Linting: `npm run lint`. No test suite exists.

## Environment

Two env files are required:
- `.env.local` — all runtime vars (NextAuth, OpenAI, Supabase, QPay, Google OAuth)
- `.env` — `DATABASE_URL` and `DIRECT_URL` only, needed so the Prisma CLI can read them

`DATABASE_URL` must use the Supabase **pooler** URL (port 6543) with `?pgbouncer=true&connection_limit=1` appended. `DIRECT_URL` uses the direct connection (port 5432). This is required because Vercel serverless + PgBouncer transaction mode conflicts with Prisma prepared statements.

Admins get infinite translation credits — set via `ADMIN_EMAILS` (comma-separated).

## Architecture

**Stack**: Next.js 14 App Router · TypeScript · Tailwind CSS · NextAuth v5 · Prisma + Supabase PostgreSQL · Supabase Storage · OpenAI · Resend email

### Route Groups
- `(app)/` — authenticated pages (dashboard, translate, history). Protected by middleware via session cookie check.
- `(auth)/` — public auth pages (signin, signup, verify-request, auth-error)
- `api/` — all backend logic lives here

### Auth (`src/lib/auth.ts`)
NextAuth v5 with PrismaAdapter and **database sessions**. Three providers: Google OAuth, Resend magic link, and Credentials (email/password with bcrypt). Credentials uses a lazy `await import("bcryptjs")` inside `authorize()` to avoid build-time issues.

Middleware (`src/middleware.ts`) checks for the `authjs.session-token` cookie directly rather than calling `auth()` — this avoids edge runtime conflicts with the Prisma adapter.

The NextAuth route handler (`api/auth/[...nextauth]/route.ts`) uses dynamic imports to prevent build-time initialization errors.

### Translation Pipeline
The translation is **client-driven and chunked** to avoid serverless timeouts:

1. `POST /api/translate` — extracts text from the file, splits into ~3000-char chunks, saves a job JSON to Supabase Storage, creates a `Translation` DB record, returns `{translationId, totalChunks}`.
2. Client calls `POST /api/translate/chunk` once per chunk, sequentially. Each call reads the job JSON, translates one chunk via OpenAI, writes progress back to storage.
3. On the final chunk, the route rebuilds the full document (PDF or DOCX) and uploads it to Supabase Storage.
4. Client polls `GET /api/translate/progress/[id]` to show real-time progress.

The job state (blocks, chunks, translated results, context summary) lives in a JSON file in Supabase Storage rather than the database — the `errorMessage` column on the `Translation` model temporarily stores the job file path.

### File Processing
- **PDF read**: `pdfjs-dist/legacy/build/pdf.mjs` with `GlobalWorkerOptions.workerSrc = ""` (web worker disabled for Node.js serverless). Groups text items into paragraphs by vertical proximity (>15px gap = new paragraph).
- **PDF write**: `pdf-lib` + `@pdf-lib/fontkit`. Embeds Noto Sans TTF fetched at runtime from Google Fonts using an old user-agent (forces TTF format instead of WOFF2) to support Cyrillic/Mongolian characters.
- **DOCX read**: `mammoth` for text extraction.
- **DOCX write**: `docx` library rebuilds the document from translated blocks.
- Both formats use a `[BLOCK_N]` marker system to align source blocks with translated output.

### OpenAI (`src/lib/openai.ts`)
Model: `gpt-5.4-mini`. Uses `max_completion_tokens` (not `max_tokens` — unsupported on this model). The `openai` export is a Proxy singleton that initializes lazily to avoid build-time crashes when the env var isn't set.

Translation always targets **Mongolian Cyrillic**. Proper nouns, URLs, code, and formatting markers are preserved verbatim. Rolling context (last ~500 chars of translated output) is passed between chunks for terminology consistency.

### Storage (`src/lib/storage.ts`)
All files go to the `translations` Supabase Storage bucket. Paths follow `{userId}/{timestamp}_{filename}`. Job JSONs live at `{userId}/jobs/{timestamp}_job.json`. Signed URLs expire in 1 hour.

### Quota / Credits
- 15,000 free chars/month per user (`FREE_CHARS_PER_MONTH`)
- Top-ups stored in `MonthlyUsage.charsPaid`
- QPay integration stubbed in `src/lib/payment.ts` — `createQPayInvoice()` and `checkQPayPayment()` are placeholders ready for Mongolian merchant credentials
