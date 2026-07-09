-- ============================================================
-- MLO Prep - initial schema (Phase 1)
-- Run in Supabase: SQL Editor -> paste -> Run.
-- Enables per-user data isolation via Row-Level Security (RLS).
-- ============================================================

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- questions (the bank) ----------
create table if not exists public.questions (
  id text primary key,
  content_area text not null check (content_area in
    ('Federal Laws','General Mortgage Knowledge','Origination Activities','Ethics','Uniform State')),
  outline_ref text,                 -- leaf id from content/outline.json (official NMLS outline)
  subtopic text,
  difficulty text check (difficulty in ('easy','medium','hard')),
  type text check (type in ('recall','application-scenario','calculation')),
  stem text not null,
  options jsonb not null,           -- array of strings
  correct_index int not null,
  explanation text not null,
  primary_source_citation text,
  is_free boolean not null default false,  -- true = available in the free diagnostic
  last_reviewed_date date,
  created_at timestamptz not null default now()
);
create index if not exists questions_area_idx on public.questions(content_area);

-- ---------- entitlements (grants full access; written by Stripe webhook) ----------
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product text not null default 'mlo_prep_lifetime',
  source text,                      -- e.g. stripe checkout session id
  granted_at timestamptz not null default now(),
  unique (user_id, product)
);

-- ---------- sessions + items (progress) ----------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('practice','exam','diagnostic')),
  area_filter text,                 -- null = all areas
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_seconds int
);
create index if not exists sessions_user_idx on public.sessions(user_id);

create table if not exists public.session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id),
  chosen_index int,
  is_correct boolean,
  presented_order int,
  answered_at timestamptz not null default now()
);
create index if not exists session_items_user_idx on public.session_items(user_id);

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.questions      enable row level security;
alter table public.entitlements   enable row level security;
alter table public.sessions       enable row level security;
alter table public.session_items  enable row level security;

-- profiles: a user sees/edits only their own row
create policy "own profile - select" on public.profiles for select using (auth.uid() = id);
create policy "own profile - update" on public.profiles for update using (auth.uid() = id);

-- questions:
--   * free/diagnostic questions are readable by anyone (funnel)
--   * full bank readable only by users holding an entitlement
create policy "free questions readable" on public.questions
  for select using (is_free = true);
create policy "entitled users read all questions" on public.questions
  for select using (
    exists (select 1 from public.entitlements e where e.user_id = auth.uid())
  );

-- entitlements: a user can read only their own (writes happen server-side via service role)
create policy "own entitlements - select" on public.entitlements
  for select using (auth.uid() = user_id);

-- sessions + items: full CRUD scoped to the owner
create policy "own sessions - all" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own session_items - all" on public.session_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
