-- ============================================================
-- MLO Prep - question reports (user-flagged question problems)
-- Run in Supabase: SQL Editor -> paste -> Run.
-- Feeds the SME answer-key review; RLS keeps reports private to their author,
-- while service-role (admin) reads the whole queue.
-- ============================================================

create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id),
  reason text not null check (reason in ('wrong_answer','typo','confusing','outdated','other')),
  note text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists question_reports_question_idx on public.question_reports(question_id);
create index if not exists question_reports_status_idx on public.question_reports(status);

alter table public.question_reports enable row level security;

-- A signed-in user may file a report as themselves and read their own reports.
-- (SME/admin triage happens server-side via the service role, which bypasses RLS.)
create policy "own reports - insert" on public.question_reports
  for insert with check (auth.uid() = user_id);
create policy "own reports - select" on public.question_reports
  for select using (auth.uid() = user_id);
