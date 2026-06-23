-- PropLedger database schema
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query -> Run).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS guards.

-- ---------------------------------------------------------------------------
-- 1. users (profile row mirroring auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. funded_accounts
-- ---------------------------------------------------------------------------
create table if not exists public.funded_accounts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  firm           text not null,
  size           numeric not null default 0,
  status         text not null default 'In challenge',
  purchase_date  date,
  challenge_fee  numeric not null default 0,
  activation_fee numeric not null default 0,
  payout_split   numeric not null default 90,
  reset_fee      numeric not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists funded_accounts_user_id_idx on public.funded_accounts (user_id);

-- ---------------------------------------------------------------------------
-- 3. payouts (belong to a funded account)
-- ---------------------------------------------------------------------------
create table if not exists public.payouts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.funded_accounts (id) on delete cascade,
  date       date,
  amount     numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists payouts_user_id_idx on public.payouts (user_id);
create index if not exists payouts_account_id_idx on public.payouts (account_id);

-- ---------------------------------------------------------------------------
-- 4. business_expenses
-- ---------------------------------------------------------------------------
create table if not exists public.business_expenses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null default '',
  amount     numeric not null default 0,
  date       date,
  recurring  boolean not null default false,
  created_at timestamptz not null default now()
);
-- For projects created before the recurring column existed:
alter table public.business_expenses add column if not exists recurring boolean not null default false;
create index if not exists business_expenses_user_id_idx on public.business_expenses (user_id);

-- ---------------------------------------------------------------------------
-- 5. Row Level Security: every user only sees their own rows
-- ---------------------------------------------------------------------------
alter table public.users             enable row level security;
alter table public.funded_accounts   enable row level security;
alter table public.payouts           enable row level security;
alter table public.business_expenses enable row level security;

-- users: a user can read/update only their own profile row
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- funded_accounts
drop policy if exists "funded_accounts_all_own" on public.funded_accounts;
create policy "funded_accounts_all_own" on public.funded_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- payouts
drop policy if exists "payouts_all_own" on public.payouts;
create policy "payouts_all_own" on public.payouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- business_expenses
drop policy if exists "business_expenses_all_own" on public.business_expenses;
create policy "business_expenses_all_own" on public.business_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. Table grants for the API roles
-- RLS decides WHICH rows a user can touch; these grants let the role reach the
-- tables at all. Without them queries fail with "permission denied for table".
-- (Tables created via the SQL editor don't always inherit these automatically.)
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated, anon;

grant select, insert, update, delete on table
  public.users,
  public.funded_accounts,
  public.payouts,
  public.business_expenses
to authenticated;

-- Auto-grant the same on any tables added to this schema later.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Auto-create a public.users profile row whenever an auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
