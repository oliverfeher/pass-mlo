-- ============================================================
-- MLO Prep - email leads (top-of-funnel capture)
-- Run in Supabase: SQL Editor -> paste -> Run.
-- Anonymous visitors can submit; only the service role reads the list.
-- NOTE: this only STORES leads. Actually emailing them needs a mail provider
-- (e.g. Resend/Postmark) wired to a server route — not included.
-- ============================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,                 -- e.g. 'diagnostic'
  created_at timestamptz not null default now()
);
create index if not exists leads_email_idx on public.leads(email);

alter table public.leads enable row level security;

-- Public funnel: anyone (even signed-out) may submit a lead; nobody may read
-- them via the anon/auth API (export happens server-side via the service role).
create policy "anyone can submit a lead" on public.leads
  for insert with check (true);
