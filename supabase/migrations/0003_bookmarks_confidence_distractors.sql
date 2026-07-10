-- ============================================================
-- MLO Prep - bookmarks, confidence, per-distractor rationales
-- Run in Supabase: SQL Editor -> paste -> Run.
-- ============================================================

-- ---------- bookmarks (personal "save to revisit", per user) ----------
create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id),
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
alter table public.bookmarks enable row level security;
create policy "own bookmarks - all" on public.bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- confidence on each answer (1=guess, 2=fairly, 3=certain) ----------
alter table public.session_items
  add column if not exists confidence smallint check (confidence between 1 and 3);

-- ---------- per-distractor rationales (why each wrong option is wrong) --------
-- jsonb array aligned to questions.options (same index order). Optional / null
-- until authored by an SME. The app remaps it alongside options when shuffling.
alter table public.questions
  add column if not exists distractor_explanations jsonb;
