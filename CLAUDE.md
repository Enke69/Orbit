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

**Stack**: Next.js 14 App Router · TypeScript · Tailwind CSS · NextAuth v5 · Prisma + Supabase PostgreSQL · Supabase Storage · OpenAI

### Route Groups
- `(app)/` — authenticated pages (home, translate, text, history, dashboard, privacy, terms). Protected by middleware via session cookie check.
- `(auth)/` — public auth pages (signin, auth-error)
- `api/` — all backend logic

### Internationalisation (`src/lib/i18n.ts` + `src/contexts/LanguageContext.tsx`)
Two languages: Mongolian (`mn`, **default**) and English (`en`). User preference stored in `localStorage` and a `orbit-lang` cookie. `LanguageProvider` wraps the root layout; `useLanguage()` hook exposes `{ lang, toggle }`. ALL UI strings live in `src/lib/i18n.ts` — including the uploader, term modal, progress components, PDF pipeline log messages, and signin page. The toggle button is in the Navbar (flag emoji + two-letter code).

### Fonts (`src/app/layout.tsx`)
Loaded via `next/font/google` with **Cyrillic subsets**: Inter (`--font-inter`, body) and Manrope (`--font-display`, headings). Do not add fonts via CSS `@import`, and any display font must include a Cyrillic subset — Mongolian headings silently fall back to system-ui otherwise.

### Layout (`src/components/layout/`)
- `Navbar.tsx` — fixed top bar; desktop nav links + mobile bottom nav. Active state via `usePathname()`. Language toggle + user dropdown with outside-click close.
- `Footer.tsx` — logo, tagline, nav links, copyright, Privacy/Terms links. Renders in selected language.

### Auth (`src/lib/auth.ts`)
NextAuth v5 with PrismaAdapter and **database sessions**. Google OAuth only — `allowDangerousEmailAccountLinking: true` (safe because there's only one provider) and `authorization: { params: { prompt: "select_account" } }` to always show account picker.

Middleware (`src/middleware.ts`) checks for the `authjs.session-token` cookie directly rather than calling `auth()` — avoids edge runtime conflicts with the Prisma adapter.

The NextAuth route handler (`api/auth/[...nextauth]/route.ts`) uses dynamic imports to prevent build-time initialization errors.

### Translation — Two Separate Pipelines

**PDF files → client-side canvas pipeline** (`src/components/sections/PdfTranslatorClient.tsx`):
1. Calls `POST /api/translate/start-pdf` first — checks document quota **up front** and returns a short-lived HMAC session token (`src/lib/pdf-session.ts`); this token must accompany every internal text/cleanup/glossary call
2. Loads PDF.js 3.11.174 from CDN (3-CDN fallback: jsdelivr → cdnjs → unpkg) in the browser
3. Renders each page to a `<canvas>` at 2× scale — preserves images, graphics, tables visually
4. Extracts text items with canvas-space coordinates; groups into lines via `groupIntoLines()`
5. Detects table rows via x-alignment + gap heuristics (`detectTableLines()`) and drawn rectangle borders from the PDF operator list — these lines are skipped for translation
6. **Groups lines into paragraphs** (`groupIntoParagraphs()`: vertical adjacency + same font size + column overlap; hyphenated words reconnected by `joinLineTexts()`). Translation happens at paragraph level, so the model always sees whole sentences — this replaced the old line-by-line + full-page cleanup double-pass (≈half the API cost)
7. Calls `POST /api/translate/text` in chunks (~2500 chars of paragraphs) with `internal: true` + `pdfToken`; each chunk call retries up to 3× with backoff (402/403 are not retried)
8. Short null-translated fragments (≤15 chars, ≤2 words) get an erase-only `""` sentinel — original text is covered but no replacement is drawn. The "already in target script" skip heuristic only applies when the target language uses Cyrillic (`targetUsesCyrillic()`)
9. After page 1, `POST /api/translate/glossary` extracts term renderings; the glossary is passed to every later call for terminology consistency
10. `drawTranslatedPage()` covers each paragraph's bounding box with the sampled background colour and redraws the translated text as a wrapped block, shrinking the font (down to 0.6×) until it fits the available height
11. Assembles final PDF from JPEG canvas snapshots using `pdf-lib` (npm, client-side)
12. Calls `POST /api/translate/save-pdf` to upload the result and create a history DB record

**DOCX/DOC files → server-side chunked pipeline**:
1. `POST /api/translate` — extracts text, splits into ~6000-char chunks, saves a job JSON to Supabase Storage, creates a `Translation` DB record, returns `{translationId, totalChunks}`. After creating the row it re-checks quota and rolls back if a parallel request over-committed (TOCTOU guard).
2. Client (`TranslationProgress.tsx`) calls `POST /api/translate/chunk` once per chunk sequentially, retrying each chunk up to 3× with backoff (safe — job state only persists on success; 4xx errors are not retried)
3. Each chunk call reads the job JSON, translates via OpenAI, writes progress back to storage. After chunk 0, `extractGlossary()` stores term renderings in the job JSON; later chunks inject them into the prompt. Structural markers (`[BLOCK_N]` etc.) are counted before/after — a mismatch triggers one retry.
4. On the final chunk, the route rebuilds the DOCX (or PDF) and uploads it to Supabase Storage
5. Job state lives in a JSON file in Supabase Storage — the `errorMessage` DB column temporarily stores the job file path

**Text-to-text** (`/text` page → `POST /api/translate/text`): auto-applies `cleanupText()` to merge PDF copy-paste line breaks before splitting into lines. Drops short null-translated fragments (≤2 words, ≤15 chars) from output instead of falling back to English.

### Technical Term Detection
Before translation starts, the user is shown a modal (`src/components/ui/TermSelectionModal.tsx`) with up to 15 detected technical/domain-specific terms:
- PDF pages: first 3 pages extracted client-side via PDF.js, sent to `POST /api/translate/detect-terms`
- DOCX files: text extracted server-side via mammoth, sent to `POST /api/translate/scan`
- The modal waits for the user (no auto-countdown); it's a proper `role="dialog"` with focus trap and Escape-to-skip. Selected terms are passed as `translateTerms[]` through all pipelines and added as a rule override in the translation system prompt.

### Translation API (`POST /api/translate/text`)
Accepts `{ lines: string[], contextSummary?, targetLanguage?, translateTerms?, internal?, pdfToken?, glossary? }`. Uses `N|||text` format: sends numbered lines, parses `N|||translated` response. Returns null for lines where translation equals source (unchanged).
- **Non-internal calls** (text page): gated by `checkTextQuota()` and record a `TextUsage` row.
- **Internal calls** (PDF pipeline, `internal: true`): bypass the text quota but **require a valid `pdfToken`** from `/api/translate/start-pdf` — returns 403 otherwise. Never trust `internal` without the token; it would be a free unlimited-translation bypass.

### Glossary Layer (terminology consistency)
`extractGlossary(source, translated, targetLang)` in `src/lib/translator.ts` pulls up to 15 term pairs from the first translated chunk/page. `formatGlossary()` in `src/lib/openai.ts` renders them into every subsequent prompt ("use these EXACT renderings"). DOCX: stored in the job JSON after chunk 0. PDF: fetched via `POST /api/translate/glossary` after page 1, kept client-side. This is the main defence against terminology drift across chunks — important for agglutinative Mongolian.

### Language Support (`src/lib/languages.ts`)
22 supported target languages. `getLanguageName(code)` maps code → full name passed to the API. Both the document translate page and text page have target language selectors. Source language defaults to auto-detect. System prompts are built dynamically — never hardcoded to Mongolian.

### File Processing
- **PDF (server-side, DOCX pipeline only)**: `unpdf` for text extraction (serverless-safe, polyfills browser APIs like DOMMatrix). Uses a `[BLOCK_N]` marker system.
- **PDF (client-side, canvas pipeline)**: PDF.js in browser. No server-side PDF reading.
- **PDF write**: `pdf-lib` + `@pdf-lib/fontkit`. Noto Sans Cyrillic embedded as base64 in `src/lib/noto-sans-b64.ts` — avoids filesystem issues on Vercel (public/ is CDN-only).
- **DOCX read**: `mammoth`. **DOCX write**: `docx` library. Both use `[BLOCK_N]` markers.
- **DOCX images**: mammoth emits data-URI `<img>` tags (often wrapped in `<p>`); `parseHtmlToBlocks()` lifts them into image blocks with base64 payloads, and `buildDocx()` re-embeds them via `ImageRun` (dimensions parsed from PNG/JPEG/GIF headers, scaled to ≤550px width). Image payloads are stripped from the job JSON — the rebuild re-extracts the original file.

### OpenAI (`src/lib/openai.ts`)
Model: `gpt-5.4-mini` by default, overridable per environment via the `TRANSLATION_MODEL` env var (enables A/B testing without a deploy). Uses `max_completion_tokens` (not `max_tokens`) — set to 16384 on translation calls because Cyrillic output is token-heavy (~2 chars/token). The `openai` export is a Proxy singleton — initializes lazily to avoid build-time crashes. `buildTranslationPrompt(text, context, sourceLang, targetLang, translateTerms?, glossary?)` builds the system prompt dynamically.

### Storage (`src/lib/storage.ts`)
All files go to the `translations` Supabase Storage bucket. Paths: `{userId}/{timestamp}_{filename}`. Job JSONs: `{userId}/jobs/{timestamp}_job.json`. Signed URLs expire in 1 hour. Supabase free tier: 1 GB file storage.

### Scheduled Cleanup (`vercel.json` + `src/app/api/cron/cleanup/route.ts`)
Vercel cron fires daily at 3 AM UTC. First marks PENDING/PROCESSING jobs older than 2 h as FAILED (orphan sweep — frees quota), then deletes storage files (original, translated, job JSON) and removes DB records older than 7 days. Protected by `CRON_SECRET` header check.

### Subscription Plans & Quota (`src/lib/quota.ts`)
Four plans stored in `User.plan` (Prisma enum: `FREE | WEEKLY | MONTHLY | VIP`). `User.planExpiresAt` — if set and in the past, the plan is treated as FREE automatically.

| Plan    | Daily | Weekly | Monthly | History  | Text/day | Text chars |
|---------|-------|--------|---------|----------|----------|------------|
| FREE    | 1     | —      | —       | last 3   | 3        | 15,000     |
| WEEKLY  | 3     | 20     | —       | 7 days   | 5        | 15,000     |
| MONTHLY | 5     | —      | 75      | 30 days  | 10       | 20,000     |
| VIP     | 100   | —      | —       | 180 days | 100      | unlimited  |
| Admin   | unlimited | —  | —       | all      | unlimited | unlimited |

`checkTranslationQuota(userId)` counts non-FAILED `Translation` rows within the relevant windows (**failed jobs don't consume quota**). Called at `POST /api/translate` (DOCX pipeline), `POST /api/translate/start-pdf` (PDF pipeline, before any spend) and `POST /api/translate/save-pdf`. Both creation routes re-check after insert and roll back on TOCTOU over-commit. `checkTextQuota()`/`recordTextUsage()` gate the text page; `GET /api/quota/text` exposes the user's limits to the client (the text page reads its char cap from there — never hardcode it). Admins (matched by `ADMIN_EMAILS` env var) bypass all limits. `NEXT_PUBLIC_ADMIN_EMAILS` is the same value exposed to the client for UI-only checks (Navbar admin link).

Subscriptions are assigned manually via the admin panel (`/admin`) — bank transfer workflow, no automated payment processing. QPay integration is stubbed in `src/lib/payment.ts` for future use.

### Admin Panel (`/admin` + `src/components/sections/AdminView.tsx`)
Server component fetches all users; client component renders plan assignment UI. Protected by `ADMIN_EMAILS` check — redirects non-admins to `/dashboard`. `POST /api/admin/set-plan` updates `User.plan` and `User.planExpiresAt`.

### Design System
Two glow effects only: `shadow-cosmic` (ambient) and `shadow-nebula` (focused highlight) — don't add more gradient/glow utilities. Brand accent: the хээ (alkhan khee) Mongolian meander ornament via `.khee-divider` (horizontal strip) and `.khee-top` (card top accent, needs extra top padding), both defined in `globals.css` as inline SVG backgrounds.

### Background (`src/components/ui/StarBackground.tsx`)
CSS `box-shadow` star field — 3 tiers (180×1px, 60×2px, 25×3px) with dual-panel seamless vertical drift. Generated in `useEffect` to avoid SSR hydration mismatch. Asteroid divs use `orbit-asteroid` keyframe. Respects `prefers-reduced-motion`.

### Assets
- Logo + favicon: `public/images/orbit-logo.png`
- Font: `src/lib/noto-sans-b64.ts` — Noto Sans Cyrillic as base64 (used by server-side PDF writer)
