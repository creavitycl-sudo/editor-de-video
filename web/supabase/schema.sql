-- Esquema del editor de video SaaS. Córrelo en Supabase: Dashboard ->
-- SQL Editor -> pega esto -> Run. Usa auth.users (ya la trae Supabase)
-- como dueño de cada fila via user_id, con RLS para que cada usuario
-- solo vea lo suyo.

create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now(),
  estado text not null default 'subiendo'
    check (estado in (
      'subiendo', 'transcribiendo', 'listo_para_revisar',
      'texto_confirmado', 'renderizando', 'listo', 'error'
    )),
  nombre_original text not null,
  video_url text, -- Vercel Blob: grabación subida
  video_normalizado_url text, -- Vercel Blob: audio ya a -14 LUFS
  render_url text, -- Vercel Blob: MP4 final
  estilo_id text not null default 'clasico',
  tema text not null default '',
  cta_palabra text not null default '',
  que_mostrar_cuando_nombra text not null default '',
  captions jsonb not null default '[]'::jsonb,
  momentos jsonb not null default '[]'::jsonb,
  error text
);

create index if not exists reels_user_id_idx on public.reels (user_id);

alter table public.reels enable row level security;

create policy "Los usuarios ven solo sus reels"
  on public.reels for select
  using (auth.uid() = user_id);

create policy "Los usuarios crean sus propios reels"
  on public.reels for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios editan solo sus reels"
  on public.reels for update
  using (auth.uid() = user_id);

create policy "Los usuarios borran solo sus reels"
  on public.reels for delete
  using (auth.uid() = user_id);

-- Glosario de transcripción: vocabulario y correcciones, por usuario.
create table if not exists public.glosarios (
  user_id uuid primary key references auth.users (id) on delete cascade,
  vocabulario text[] not null default '{}',
  correcciones jsonb not null default '{}'::jsonb
);

alter table public.glosarios enable row level security;

create policy "Los usuarios ven solo su glosario"
  on public.glosarios for select
  using (auth.uid() = user_id);

create policy "Los usuarios escriben solo su glosario"
  on public.glosarios for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
