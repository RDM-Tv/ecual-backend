-- Ejecutar UNA vez en Supabase → SQL Editor → New query → Run
create table if not exists public.push_subs (
  endpoint   text primary key,
  p256dh     text not null,
  auth       text not null,
  ciudades   text[] not null default '{}',
  creado_en  timestamptz not null default now()
);

alter table public.push_subs enable row level security;

drop policy if exists "backend_push_subs" on public.push_subs;
create policy "backend_push_subs" on public.push_subs
  for all to anon using (true) with check (true);
