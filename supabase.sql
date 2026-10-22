-- Pégalo una vez en Supabase → SQL Editor → New query → Run.
-- Crea la tabla donde cada cuenta guarda su progreso y la regla de que
-- cada persona solo puede leer y escribir lo suyo.

create table if not exists public.estados (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.estados enable row level security;

drop policy if exists "cada quien lo suyo" on public.estados;
create policy "cada quien lo suyo" on public.estados
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
