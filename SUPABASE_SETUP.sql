-- ============================================================================
-- DIDACTIC ESL ATM 4.0 - SUPABASE CLOUD DATABASE SETUP (RUN ONCE)
-- ============================================================================
-- Instructions:
-- 1. Go to https://supabase.com and open your free project.
-- 2. In the left sidebar, click "SQL Editor" -> "New query".
-- 3. Paste this entire script and click "Run" (or press Ctrl+Enter).
-- ============================================================================

-- 1. Authoritative Classroom State Table (Roster, Loans, Store, Classrooms, Settings)
create table if not exists public.atm_classroom_state (
  id text primary key default 'main',
  version integer not null default 4,
  updated_at timestamptz not null default now(),
  state jsonb not null
);

-- 2. Atomic Student Actions Queue (Prevents race conditions when 30+ students act at once)
create table if not exists public.atm_student_actions (
  id text primary key,
  action_type text not null,
  student_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_atm_student_actions_created_at
  on public.atm_student_actions (created_at asc);

-- 3. Enable Row Level Security (RLS) with classroom access policies for Anon Key
alter table public.atm_classroom_state enable row level security;
alter table public.atm_student_actions enable row level security;

drop policy if exists "Allow public read/write on atm_classroom_state" on public.atm_classroom_state;
create policy "Allow public read/write on atm_classroom_state"
  on public.atm_classroom_state
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Allow public read/write on atm_student_actions" on public.atm_student_actions;
create policy "Allow public read/write on atm_student_actions"
  on public.atm_student_actions
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- 4. Enable Supabase Realtime on both tables for instant (<0.1s) WebSocket push
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'atm_classroom_state'
  ) then
    alter publication supabase_realtime add table public.atm_classroom_state;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'atm_student_actions'
  ) then
    alter publication supabase_realtime add table public.atm_student_actions;
  end if;
end $$;
