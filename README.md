# MLO Prep

Full-SaaS exam prep for the SAFE MLO National Test with Uniform State Content.
Next.js (App Router) · Supabase (Postgres + Auth + RLS) · Stripe (one-time purchase) · deploy on Vercel.

This is the **Phase 1 foundation** from the PRD: accounts, RLS-scoped synced progress,
a working practice flow wired to the database, a free public diagnostic, and the
Stripe checkout + entitlement scaffold. See "What's built vs. next" below.

---

## Prerequisites

- Node.js 18.18+ (or 20+)
- A free [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (only needed for the purchase flow)

## Setup

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
#   Fill in from Supabase → Project Settings → API:
#     NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 3. Create the schema
#   Supabase → SQL Editor → paste the contents of
#   supabase/migrations/0001_init.sql → Run

# 4. Seed the question bank
npm run seed

# 5. Run
npm run dev
#   → http://localhost:3000
```

The free diagnostic works immediately at `/practice?mode=diagnostic` (no account).
To reach the full bank you need an account **and** an entitlement row — either
complete the Stripe flow (Phase 3 below) or, for local testing, insert one manually:

```sql
insert into public.entitlements (user_id, product)
values ('<your-auth-user-uuid>', 'mlo_prep_lifetime');
```

## Stripe (purchase flow)

1. Create a **one-time** Price in Stripe; put its id in `NEXT_PUBLIC_STRIPE_PRICE_ID`.
2. Add `STRIPE_SECRET_KEY`.
3. Point a webhook at `/api/stripe/webhook` for the `checkout.session.completed`
   event; put the signing secret in `STRIPE_WEBHOOK_SECRET`.
   Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

On successful payment the webhook writes the buyer's `entitlements` row, which
unlocks the full bank (enforced by RLS).

---

## Architecture notes

- **RLS is the real gate.** Row-Level Security policies in `0001_init.sql` ensure a
  user can read/write only their own sessions and items, free questions are public,
  and the full bank is readable only by entitled users. The UI checks mirror this
  but the database enforces it.
- **The official NMLS outline is the authoring source of truth.**
  `content/outline.json` encodes the SAFE MLO National Test with Uniform State
  Content Outline (every testable node with a stable leaf id and the official
  per-area weights). Every question in `content/questions.json` carries an
  `outline_ref` pointing to one of those leaves, so authoring is a systematic
  gap-fill rather than guesswork. Question ids are opaque — `content_area` and
  `outline_ref` are authoritative.
- **Coverage report.** `npm run coverage` cross-references the bank against the
  outline and prints, per area, current vs. target counts and every uncovered
  node. Use it to decide what to write next.
- **Content pipeline.** The bank is built by a reproducible chain:
  `npm run build:bank` runs the authoring batches + parametric calc generators
  and finishes with a normalization pass that dedupes stems, guarantees four
  distinct options, and shuffles answer keys (removing answer-position bias).
- **Answer-key QA.** `npm run qa` runs a static audit (answer-position balance,
  duplicate stems/options, missing citations, keying sanity) with no live data.
  `npm run monitor` is data-driven: once users have answered questions it queries
  `session_items` and flags items with anomalous correct rates (a low rate often
  means a miskeyed answer) so review is targeted, not a cold read of all items.
- **Content lives in the repo.** Questions live in `content/questions.json` and are
  seeded to Postgres. Add batches, then re-run `npm run build:bank` and `npm run seed`.
- **Marketing pages render on the server** (`src/app/page.tsx`) so they can rank in
  search — the organic-acquisition strategy from the PRD.

## What's built vs. next

Built (Phase 1):
- Email/password auth (`/login`, `/signup`) via Supabase
- Schema + RLS, auto-profile creation
- Free public diagnostic + practice mode with per-question explanations
- Session + per-item persistence, synced by user
- End-of-session score + per-content-area breakdown + readiness signal
- Stripe checkout + webhook + entitlement gating scaffold
- SSR landing + pricing pages

Next (per PRD):
- Timed full-length exam mode (component supports `mode="exam"`; add the clock + a
  dedicated entry point)
- Persistent cross-session mastery dashboard (aggregate `session_items` → `area_mastery`)
- Review queue of missed questions
- Spaced-repetition engine (v1.1)
- Content to launch volume (~350–400 reviewed questions) + SME/legal review
- OAuth / magic-link sign-in, password reset, account page

---

*Study aid. Not affiliated with or endorsed by NMLS. Not legal advice. Verify current
figures against the official NMLS Test Content Outline. Have content reviewed by a
qualified SME and the product reviewed by an attorney before commercial launch.*
