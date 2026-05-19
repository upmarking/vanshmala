-- ============================================================
-- Vedic Kundali — stores user birth-data inputs & calculation
-- results from the VedicPanchanga API.
-- ============================================================

-- 1. kundali_inputs  — the form values the user submitted
create table if not exists public.kundali_inputs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default '',
  birth_date  date not null,
  birth_time  time not null,
  latitude    float8 not null,
  longitude   float8 not null,
  timezone    text,                        -- IANA tz name or UTC offset string
  place_name  text,                        -- human-readable location label
  ayanamsa    text not null default 'lahiri',
  language    text not null default 'en',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. kundali_results — the API response cached per calc type
create table if not exists public.kundali_results (
  id          uuid primary key default gen_random_uuid(),
  input_id    uuid not null references public.kundali_inputs(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  calc_type   text not null check (calc_type in ('kundali', 'panchang', 'muhurta')),
  result_data jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists idx_kundali_inputs_user   on public.kundali_inputs(user_id);
create index if not exists idx_kundali_results_user   on public.kundali_results(user_id);
create index if not exists idx_kundali_results_input  on public.kundali_results(input_id);

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.kundali_inputs  enable row level security;
alter table public.kundali_results enable row level security;

-- kundali_inputs policies
create policy "Users can view own kundali inputs"
  on public.kundali_inputs for select
  using (auth.uid() = user_id);

create policy "Users can insert own kundali inputs"
  on public.kundali_inputs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own kundali inputs"
  on public.kundali_inputs for update
  using (auth.uid() = user_id);

create policy "Users can delete own kundali inputs"
  on public.kundali_inputs for delete
  using (auth.uid() = user_id);

-- kundali_results policies
create policy "Users can view own kundali results"
  on public.kundali_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own kundali results"
  on public.kundali_results for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own kundali results"
  on public.kundali_results for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at on kundali_inputs
create or replace function public.handle_kundali_input_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_kundali_input_update
  before update on public.kundali_inputs
  for each row execute function public.handle_kundali_input_updated_at();
