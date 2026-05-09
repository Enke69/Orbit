# Orbit — Setup Guide

The code is complete and builds successfully. You only need to fill in external credentials.

---

## What's already done
- Full Next.js app built and compiles clean
- Cosmic UI with all pages (landing, signin, dashboard, translate, history)
- GPT-5.4-mini translation engine with context
- PDF and DOCX file processing
- Google + email magic link auth
- Usage tracking + paywall logic (15k chars free/mo)
- QPay payment stub (ready for your credentials)
- Supabase storage integration
- NEXTAUTH_SECRET already generated in `.env.local`

---

## What you need to do (in order)

### Step 1 — Supabase (free)
1. Go to https://supabase.com → "New project"
2. Name it `orbit`, pick any region, set a password
3. Wait ~2 minutes for it to provision
4. Go to **Project Settings → Database → Connection string**
   - Copy the **URI** (with pgbouncer=true) → paste as `DATABASE_URL` in `.env.local`
   - Copy the **Direct connection URI** → paste as `DIRECT_URL`
5. Go to **Project Settings → API**
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
6. Go to **Storage → New bucket**
   - Name: `translations`
   - Make it **private** (not public)
   - Click Create

### Step 2 — Push database schema
Once DATABASE_URL and DIRECT_URL are filled in:
```bash
npm run db:push
```
This creates all the tables automatically.

### Step 3 — Google OAuth (free)
1. Go to https://console.cloud.google.com
2. Create a new project called "Orbit"
3. Go to **APIs & Services → OAuth consent screen**
   - Choose External → fill in app name "Orbit", your email
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - (Add your production URL too when you deploy to Vercel)
5. Copy **Client ID** → `GOOGLE_CLIENT_ID`
6. Copy **Client secret** → `GOOGLE_CLIENT_SECRET`

### Step 4 — Resend email (free — 3,000 emails/month)
1. Go to https://resend.com → Sign up
2. Go to **API Keys → Create API Key**
3. Copy the key → `RESEND_API_KEY`
4. Update `EMAIL_FROM` with your verified domain (or use Resend's sandbox for testing)

### Step 5 — OpenAI API key
1. Go to https://platform.openai.com → API keys
2. Create a new key → paste as `OPENAI_API_KEY`
3. Make sure you have credits on your account

### Step 6 — Run locally
```bash
npm run dev
```
Open http://localhost:3000

### Step 7 — Deploy to Vercel (free)
1. Push this folder to a GitHub repo
2. Go to https://vercel.com → Import project → select your repo
3. Add all env vars from `.env.local` to Vercel's environment settings
4. Change `NEXTAUTH_URL` to your Vercel URL (e.g. `https://orbit-xyz.vercel.app`)
5. Add your Vercel URL as authorized redirect in Google Cloud Console
6. Click Deploy

### Step 8 — QPay (when ready)
1. Register as a merchant at https://qpay.mn
2. Fill in `QPAY_USERNAME`, `QPAY_PASSWORD`, `QPAY_INVOICE_CODE` in `.env.local`
3. Implement `createQPayInvoice()` in `src/lib/payment.ts` following their API docs

---

## File structure recap

```
src/
├── app/
│   ├── (app)/          ← public + authed pages with navbar
│   ├── (auth)/         ← signin, verify pages (no navbar)
│   └── api/            ← translate, download, usage, auth endpoints
├── components/
│   ├── ui/             ← Button, Card, Badge, ProgressBar
│   ├── layout/         ← Navbar
│   └── sections/       ← FileUploader, TranslationProgress
└── lib/
    ├── openai.ts       ← GPT-5.4-mini client + prompt
    ├── translator.ts   ← chunker + context engine
    ├── docx-processor  ← Word read/write
    ├── pdf-processor   ← PDF read/write
    ├── payment.ts      ← QPay stub
    ├── storage.ts      ← Supabase file storage
    ├── auth.ts         ← NextAuth (server)
    └── auth-edge.ts    ← NextAuth (middleware/edge)
```
