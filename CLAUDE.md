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
- `.env.local` — all runtime vars (NextAuth, OpenAI, Supabase, QPay, Google OAuth, CRON_SECRET)
- `.env` — `DATABASE_URL` and `DIRECT_URL` only, needed so the Prisma CLI can read them

`DATABASE_URL` must use the Supabase **pooler** URL (port 6543) with `?pgbouncer=true&connection_limit=1` appended. `DIRECT_URL` uses the direct connection (port 5432). Required because Vercel serverless + PgBouncer transaction mode conflicts with Prisma prepared statements.

Admins get infinite translation credits — set via `ADMIN_EMAILS` (comma-separated). Free users see only their last 3 translation history entries.

`CRON_SECRET` protects the `/api/cron/cleanup` endpoint — Vercel sends it as `Authorization: Bearer <CRON_SECRET>` when firing the daily cron.

## Architecture

**Stack**: Next.js 14 App Router · TypeScript · Tailwind CSS · NextAuth v5 · Prisma + Supabase PostgreSQL · Supabase Storage · OpenAI · Resend email

### Route Groups
- `(app)/` — authenticated pages (home, translate, text, history, dashboard, privacy, terms). Protected by middleware via session cookie check.
- `(auth)/` — public auth pages (signin, signup, verify-request, auth-error)
- `api/` — all backend logic

### Internationalisation (`src/lib/i18n.ts` + `src/contexts/LanguageContext.tsx`)
Two languages: English (`en`) and Mongolian (`mn`). User preference stored in `localStorage` and a `orbit-lang` cookie. `LanguageProvider` wraps the root layout; `useLanguage()` hook exposes `{ lang, toggle }`. All UI strings for the home page, Navbar, Footer, Privacy, and Terms live in `src/lib/i18n.ts`. The toggle button is in the Navbar (flag emoji + two-letter code).

### Layout (`src/components/layout/`)
- `Navbar.tsx` — fixed top bar; desktop nav links + mobile bottom nav. Active state via `usePathname()`. Language toggle + user dropdown with outside-click close.
- `Footer.tsx` — logo, tagline, nav links, copyright, Privacy/Terms links. Renders in selected language.

### Auth (`src/lib/auth.ts`)
NextAuth v5 with PrismaAdapter and **database sessions**. Three providers: Google OAuth, Resend magic link, and Credentials (email/password with bcrypt). Credentials uses a lazy `await import("bcryptjs")` inside `authorize()` to avoid build-time issues.

Middleware (`src/middleware.ts`) checks for the `authjs.session-token` cookie directly rather than calling `auth()` — avoids edge runtime conflicts with the Prisma adapter.

The NextAuth route handler (`api/auth/[...nextauth]/route.ts`) uses dynamic imports to prevent build-time initialization errors.

### Translation — Two Separate Pipelines

**PDF files → client-side canvas pipeline** (`src/components/sections/PdfTranslatorClient.tsx`):
1. Loads PDF.js 3.11.174 from CDN (3-CDN fallback: jsdelivr → cdnjs → unpkg) in the browser
2. Renders each page to a `<canvas>` at 2× scale — preserves images, graphics, tables visually
3. Extracts text items with canvas-space coordinates; groups into lines via `groupIntoLines()`
4. Detects table rows via x-alignment + gap heuristics (`detectTableLines()`) and drawn rectangle borders from the PDF operator list — these lines are skipped for translation
5. Calls `POST /api/translate/text` in chunks (~1000 chars), receives translated lines back
6. Short null-translated fragments (≤15 chars, ≤2 words, non-Cyrillic) get an erase-only `""` sentinel — original text is covered but no replacement is drawn
7. After all chunks, a quality-check pass calls `POST /api/translate/cleanup` with `{original, translated}` pairs for the whole page — GPT fixes cut sentences and untranslated fragments with full context
8. Assembles final PDF from JPEG canvas snapshots using `pdf-lib` (npm, client-side)
9. Calls `POST /api/translate/save-pdf` to upload the result and create a history DB record

**DOCX/DOC files → server-side chunked pipeline**:
1. `POST /api/translate` — extracts text, splits into ~3000-char chunks, saves a job JSON to Supabase Storage, creates a `Translation` DB record, returns `{translationId, totalChunks}`
2. Client (`TranslationProgress.tsx`) calls `POST /api/translate/chunk` once per chunk sequentially
3. Each chunk call reads the job JSON, translates via OpenAI, writes progress back to storage
4. On the final chunk, the route rebuilds the DOCX (or PDF) and uploads it to Supabase Storage
5. Job state lives in a JSON file in Supabase Storage — the `errorMessage` DB column temporarily stores the job file path

**Text-to-text** (`/text` page → `POST /api/translate/text`): auto-applies `cleanupText()` to merge PDF copy-paste line breaks before splitting into lines. Drops short null-translated fragments (≤2 words, ≤15 chars) from output instead of falling back to English.

### Technical Term Detection
Before translation starts, the user is shown a modal (`src/components/ui/TermSelectionModal.tsx`) with up to 15 detected technical/domain-specific terms:
- PDF pages: first 3 pages extracted client-side via PDF.js, sent to `POST /api/translate/detect-terms`
- DOCX files: text extracted server-side via mammoth, sent to `POST /api/translate/scan`
- 15-second countdown auto-confirms. Selected terms are passed as `translateTerms[]` through all pipelines and added as a rule override in the translation system prompt.

### Translation API (`POST /api/translate/text`)
Accepts `{ lines: string[], contextSummary?: string, targetLanguage?: string, sourceLanguage?: string, translateTerms?: string[] }`. Uses `N|||text` format: sends numbered lines, parses `N|||translated` response. Returns null for lines where translation equals source (unchanged). Checks auth + quota, deducts chars from `MonthlyUsage`.

### Quality-Check API (`POST /api/translate/cleanup`)
Accepts `{ original: string[], translated: (string|null)[], targetLanguage }`. Sends combined `N|||ORIG: ...|||CURR: ...` format to GPT. Returns corrected lines — fixes cut sentences, translates `[NOT TRANSLATED]` fragments using full page context. Falls back to original translations on error.

### Language Support (`src/lib/languages.ts`)
22 supported target languages. `getLanguageName(code)` maps code → full name passed to the API. Both the document translate page and text page have target language selectors. Source language defaults to auto-detect. System prompts are built dynamically — never hardcoded to Mongolian.

### File Processing
- **PDF (server-side, DOCX pipeline only)**: `unpdf` for text extraction (serverless-safe, polyfills browser APIs like DOMMatrix). Uses a `[BLOCK_N]` marker system.
- **PDF (client-side, canvas pipeline)**: PDF.js in browser. No server-side PDF reading.
- **PDF write**: `pdf-lib` + `@pdf-lib/fontkit`. Noto Sans Cyrillic embedded as base64 in `src/lib/noto-sans-b64.ts` — avoids filesystem issues on Vercel (public/ is CDN-only).
- **DOCX read**: `mammoth`. **DOCX write**: `docx` library. Both use `[BLOCK_N]` markers.

### OpenAI (`src/lib/openai.ts`)
Model: `gpt-5.4-mini`. Uses `max_completion_tokens` (not `max_tokens`). The `openai` export is a Proxy singleton — initializes lazily to avoid build-time crashes. `buildTranslationPrompt(text, context, sourceLang, targetLang, translateTerms?)` builds the system prompt dynamically.

### Storage (`src/lib/storage.ts`)
All files go to the `translations` Supabase Storage bucket. Paths: `{userId}/{timestamp}_{filename}`. Job JSONs: `{userId}/jobs/{timestamp}_job.json`. Signed URLs expire in 1 hour. Supabase free tier: 1 GB file storage.

### Scheduled Cleanup (`vercel.json` + `src/app/api/cron/cleanup/route.ts`)
Vercel cron fires daily at 3 AM UTC. Deletes storage files (original, translated, job JSON) then removes DB records older than 7 days. Protected by `CRON_SECRET` header check.

### Quota / Credits
- 15,000 free chars/month per user (`FREE_CHARS_PER_MONTH` in `src/lib/openai.ts`)
- Top-ups stored in `MonthlyUsage.charsPaid`
- QPay integration stubbed in `src/lib/payment.ts` — placeholders ready for Mongolian merchant credentials (QPAY_USERNAME, QPAY_PASSWORD, QPAY_INVOICE_CODE)

### Background (`src/components/ui/StarBackground.tsx`)
CSS `box-shadow` star field — 3 tiers (180×1px, 60×2px, 25×3px) with dual-panel seamless vertical drift. Generated in `useEffect` to avoid SSR hydration mismatch. Asteroid divs use `orbit-asteroid` keyframe. Respects `prefers-reduced-motion`.

### Assets
- Logo + favicon: `public/images/orbit-logo.png`
- Font: `src/lib/noto-sans-b64.ts` — Noto Sans Cyrillic as base64 (used by server-side PDF writer)
