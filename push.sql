-- Pégalo una vez en Supabase → SQL Editor → New query → Run.
-- Guarda dónde enviar las notificaciones de cada teléfono. Cada persona solo ve y cambia lo suyo;
-- el envío (GitHub Actions) usa la clave de servicio, que no está en la app.
create table if not exists public.push_subs (
  endpoint   text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  tz         text not null default 'UTC',
  prefs      jsonb not null default '{}'::jsonb,
  ultimo     timestamptz,
  creado     timestamptz not null default now()
);

alter table public.push_subs enable row level security;

drop policy if exists "cada quien sus avisos" on public.push_subs;
create policy "cada quien sus avisos" on public.push_subs
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
