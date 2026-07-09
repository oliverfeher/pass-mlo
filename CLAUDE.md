# CLAUDE.md — Project Brief

> Read this first. It's the working memory for this repo across sessions.
> Keep it updated as the project evolves — it's what lets any future Claude Code
> session pick up instantly without re-deriving context.

## What this is

An exam-prep SaaS for the **SAFE MLO National Test with Uniform State Content**
(the licensing exam for U.S. mortgage loan originators). The wedge is not "more
questions" — free question banks exist — but sharper explanations that teach
trap-spotting, a weak-area diagnostic users trust, a fast mobile-first UX, and
organic-search distribution.

Business model: **one-time purchase** for lifetime access (no subscription), with
a **free no-account diagnostic** as the top of funnel.

## Stack

- **Next.js 14 (App Router)** — SSR marketing pages (for SEO) + app behind auth, one codebase.
- **Supabase** — Postgres + Auth + Row-Level Security. Project name: `pass-mlo`.
- **Stripe** — one-time Checkout + webhook that writes an entitlement row.
- **Hosting target:** Vercel (app) + Supabase (db/auth). Not yet deployed.
- Language: TypeScript. Styling: inline styles + a little Tailwind. No CSS framework beyond that.

## Repo map

```
content/
  outline.json        # OFFICIAL NMLS test content outline, encoded as the coverage taxonomy (source of truth)
  questions.json      # THE question bank (307 items) — built artifact, do not hand-edit
  base_seed.json      # frozen 30-question base the pipeline builds on (reproducibility)
  build_bank.py       # authoring batch 1 (concept) + parametric calc generators
  bank_batch2.py..4.py# additional authoring batches
  normalize.py        # dedupes stems, guarantees 4 distinct options, shuffles keys (kills answer-position bias)
scripts/
  coverage.mjs        # questions vs. outline gap report  (npm run coverage)
  qa_report.mjs       # static answer-key audit           (npm run qa)
  correct_rate_monitor.mjs # data-driven key QA from live attempts (npm run monitor)
supabase/
  migrations/0001_init.sql  # schema + RLS policies (run in Supabase SQL editor)
  seed.ts             # loads questions.json into Postgres (npm run seed)
src/
  app/                # pages: / (landing), /login, /signup, /practice, /pricing, api/checkout, api/stripe/webhook
  components/PracticeRunner.tsx  # the quiz engine (client)
  lib/                # supabase clients, scoring/readiness, entitlement gating
  middleware.ts       # refreshes the Supabase session cookie
```

## Content model (important)

- Every question maps to an **`outline_ref`** leaf id in `content/outline.json`.
- **`content_area` and `outline_ref` are authoritative. Question ids are opaque** —
  do not infer area from the id prefix.
- Content areas + exam weights: Origination 27%, Federal 24%, General 20%, Ethics 18%, Uniform State 11%.
- `questions.json` is a BUILT ARTIFACT. To change content, edit the batch files or add a
  new batch, then regenerate — don't hand-edit `questions.json`.

### Content pipeline (reproducible / idempotent)

```
npm run build:bank   # runs build_bank -> batch2 -> batch3 -> batch4 -> normalize
```

Rebuilds `questions.json` deterministically from `base_seed.json` + the batches
(fixed random seeds). Running it twice yields the same 307. After a rebuild:
`npm run qa` (expect 0 errors) and `npm run coverage` (expect all 126 nodes covered),
then `npm run seed` to push to the DB.

## Current state (update this section as things change)

- **307 questions**, covering **all 126 outline nodes**. Answer keys balanced
  (audited: A~26% B~22% C~27% D~26%), 0 QA errors.
- App runs locally against the `pass-mlo` Supabase project. Schema applied, bank seeded.
- Auth: email/password. "Confirm email" is toggled OFF for local dev.
- The full bank is gated behind an account **and** an `entitlements` row. Grant it
  manually for testing (see below); Stripe is on placeholder keys locally.
- Full-length exam sessions supported (session cap raised to 120; exam mode defaults to 115).
- **Recently fixed (for real):** `PracticeRunner.tsx` shuffled during render → React
  hydration mismatch. The shuffle had been in a `useMemo` (still runs during render on
  both server and client, so `Math.random()` diverged). It now runs in a client-only
  `useEffect` that sets `session` state, with `session: Question[] | null` and a
  "Loading questions…" state on the initial (`null`) render. If you touch that file,
  keep randomness/time out of render — no `Math.random()`/`Date` in render or `useMemo`.

## Local dev

```
npm install
cp .env.example .env         # fill in Supabase URL + legacy anon + service_role keys
# run supabase/migrations/0001_init.sql in the Supabase SQL editor
npm run seed                 # -> "Seeded 307 questions"
npm run dev                  # http://localhost:3000
```

Free diagnostic (no account): `/practice?mode=diagnostic`.
Unlock the full bank for your test account (skip Stripe locally) — run in Supabase SQL editor:

```sql
insert into public.entitlements (user_id, product)
select id, 'mlo_prep_lifetime' from auth.users
order by created_at desc limit 1
on conflict (user_id, product) do nothing;
```

## Known next steps (roadmap)

- **Timed-exam UI**: add the clock + a full-length exam entry point on the existing
  `exam` mode in PracticeRunner.
- **Mastery dashboard**: aggregate `session_items` into per-area/per-subtopic mastery
  that persists across sessions (the readiness signal, but durable).
- **Review queue**: re-drill missed questions until answered correctly N times.
- **Spaced repetition** (v1.1): the `srs_state` table is anticipated in the schema notes.
- **Content**: last stretch to the 351 target if desired; then depth per node.
- **Deploy**: Vercel + Supabase + Stripe (one-time Price, webhook → entitlement).
- **CI**: GitHub Action running `npm run qa` + `npm run coverage` on every push so a
  miskeyed or uncovered question can't merge.

## Hard gates before this can be SOLD (do not skip)

1. **SME accuracy review** of the answer keys by a licensed MLO / compliance person.
   A single miskeyed answer in a licensing product is a real liability. Use
   `npm run monitor` once there's traffic to target the review at anomalous items.
2. **Legal review** of the content approach, disclaimers, terms, and NMLS trademark
   usage. The product may reference the exam it prepares users for but must NOT imply
   NMLS endorsement/affiliation. Disclaimers are present in the UI and LICENSE.
3. **Content sourcing rule (non-negotiable):** questions are authored clean-room from
   **primary sources** (statutes/regs) and the **public NMLS Test Content Outline** only.
   Never adapt a competitor's wording or reproduce actual NMLS exam items.

## Conventions

- Never commit `.env` (it's gitignored). Real keys live only in `.env` locally and in
  the host's environment variables in production.
- Using the **legacy** Supabase `anon` / `service_role` keys (the code expects JWT-style
  keys in those env slots). New `sb_publishable_`/`sb_secret_` keys also work as drop-ins
  if ever switched.
- RLS is the real access gate; UI checks mirror it. Don't rely on UI checks alone.
- Keep this file current. When you finish a chunk of work, update "Current state".