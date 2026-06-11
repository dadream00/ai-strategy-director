create extension if not exists pgcrypto;

create table if not exists public.ai_director_outputs (
  id uuid primary key default gen_random_uuid(),
  feature text not null check (feature in ('keyword', 'content', 'write', 'report', 'proposal')),
  title text not null,
  primary_input text,
  inputs jsonb not null default '{}'::jsonb,
  output_markdown text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_director_outputs_created_at_idx
  on public.ai_director_outputs (created_at desc);

create index if not exists ai_director_outputs_feature_idx
  on public.ai_director_outputs (feature);

alter table public.ai_director_outputs enable row level security;

drop policy if exists "No public access to ai director outputs" on public.ai_director_outputs;

create policy "No public access to ai director outputs"
  on public.ai_director_outputs
  for all
  using (false)
  with check (false);

-- The app writes through server routes with SUPABASE_SERVICE_ROLE_KEY.
-- Do not expose the service role key to the browser.
