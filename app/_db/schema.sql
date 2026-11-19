-- =========================================================
-- Furor App · esquema de base de datos (Supabase / Postgres)
-- Pegar completo en Supabase → SQL Editor → Run
-- Antes de correrlo: reemplazá MAIL_ADMIN por tu mail (abajo de todo)
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- Integrantes (lista de acceso) ----------
create table if not exists public.miembros (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text not null default '',
  rol text not null default 'otro'
    check (rol in ('admin','cm','setter','diseno','ugc','web','otro')),
  sede text not null default '',
  activo boolean not null default true,
  user_id uuid unique references auth.users(id) on delete set null,
  creado timestamptz not null default now()
);

-- ---------- Funciones de permisos ----------
create or replace function public.mi_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.miembros where user_id = auth.uid() and activo limit 1
$$;

create or replace function public.es_miembro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.miembros where user_id = auth.uid() and activo)
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.miembros where user_id = auth.uid() and activo and rol = 'admin')
$$;

-- Solo se pueden registrar los mails cargados en miembros
create or replace function public.validar_registro() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  if not exists (select 1 from public.miembros where lower(email) = lower(new.email) and activo) then
    raise exception 'MAIL_NO_AUTORIZADO';
  end if;
  update public.miembros set user_id = new.id where lower(email) = lower(new.email);
  -- Los mails autorizados por el admin no necesitan confirmar por correo
  update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = new.id;
  return new;
end $$;

drop trigger if exists al_registrarse on auth.users;
create trigger al_registrarse after insert on auth.users
  for each row execute function public.validar_registro();

-- ---------- Clientes ----------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rubro text default '',
  sede text default '',
  estado text not null default 'Activo',
  plan text default '',
  responsable uuid references public.miembros(id) on delete set null,
  contacto text default '',
  whatsapp text default '',
  instagram text default '',
  web text default '',
  inicio date,
  inversion text default '',
  notas text default '',
  marca jsonb not null default '{}'::jsonb,      -- tono, colores, tipografías, sí / no
  recursos jsonb not null default '[]'::jsonb,   -- [{nombre, url}]
  accesos jsonb not null default '[]'::jsonb,    -- [{plataforma, usuario, link}] sin contraseñas
  pauta jsonb not null default '{}'::jsonb,      -- {"lun":["Feed","Historia"], ...}
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

-- ---------- Tareas ----------
create table if not exists public.tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  detalle text default '',
  asignado uuid references public.miembros(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete cascade,
  area text default 'General',
  prioridad text not null default 'media' check (prioridad in ('alta','media','baja')),
  estado text not null default 'pendiente' check (estado in ('pendiente','curso','hecha')),
  vence date,
  creado_por uuid references public.miembros(id) on delete set null,
  creado timestamptz not null default now(),
  hecha_el timestamptz
);

-- ---------- Agenda (reuniones, llamadas, videollamadas) ----------
create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null default 'Reunión' check (tipo in ('Reunión','Llamada','Videollamada')),
  fecha date not null,
  hora time,
  duracion int default 30,
  sede text default '',
  cliente_id uuid references public.clientes(id) on delete set null,
  contacto text default '',
  lugar text default '',
  link text default '',
  participantes uuid[] not null default '{}',
  notas text default '',
  creado_por uuid references public.miembros(id) on delete set null,
  creado timestamptz not null default now()
);

-- ---------- Entregas (reels, posts, carruseles, historias) ----------
create table if not exists public.entregas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  titulo text not null,
  formato text not null default 'Reel',
  estado text not null default 'En edición'
    check (estado in ('En edición','Para revisar','Aprobada','Programada','Publicada')),
  fecha_pub date,
  copy text default '',
  link text default '',
  archivos jsonb not null default '[]'::jsonb,   -- [{path, nombre, tipo, tam}]
  asignado uuid references public.miembros(id) on delete set null,
  creado_por uuid references public.miembros(id) on delete set null,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

-- ---------- Publicaciones hechas (check del calendario de contenido) ----------
create table if not exists public.publicaciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  fecha date not null,
  formato text not null,
  hecho_por uuid references public.miembros(id) on delete set null,
  creado timestamptz not null default now(),
  unique (cliente_id, fecha, formato)
);

-- ---------- Chat (por cliente o general cuando cliente_id es null) ----------
create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade,
  autor uuid references public.miembros(id) on delete set null,
  texto text not null,
  pedido boolean not null default false,
  resuelto boolean not null default false,
  creado timestamptz not null default now()
);

-- ---------- Novedades ----------
create table if not exists public.novedades (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  etiqueta text default '',
  autor uuid references public.miembros(id) on delete set null,
  fijada boolean not null default false,
  creado timestamptz not null default now()
);

-- ---------- Configuración (enfoque de la semana, etc.) ----------
create table if not exists public.config (
  clave text primary key,
  valor jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now()
);

-- ---------- Permisos de tablas (la seguridad fina la dan las políticas) ----------
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.miembros, public.clientes, public.tareas, public.eventos, public.entregas, public.publicaciones, public.mensajes, public.novedades, public.config to authenticated;
revoke all on public.miembros, public.clientes, public.tareas, public.eventos, public.entregas, public.publicaciones, public.mensajes, public.novedades, public.config from anon;

-- ---------- Seguridad por filas ----------
alter table public.miembros enable row level security;
alter table public.clientes enable row level security;
alter table public.tareas enable row level security;
alter table public.eventos enable row level security;
alter table public.entregas enable row level security;
alter table public.publicaciones enable row level security;
alter table public.mensajes enable row level security;
alter table public.novedades enable row level security;
alter table public.config enable row level security;

-- miembros: todos leen, solo admin gestiona
drop policy if exists miembros_leer on public.miembros;
create policy miembros_leer on public.miembros for select using (public.es_miembro());
drop policy if exists miembros_admin on public.miembros;
create policy miembros_admin on public.miembros for all using (public.es_admin()) with check (public.es_admin());

-- tablas de trabajo: todo el equipo lee y escribe
do $$
declare t text;
begin
  foreach t in array array['tareas','eventos','entregas','publicaciones','mensajes','novedades'] loop
    execute format('drop policy if exists %1$s_equipo on public.%1$s', t);
    execute format('create policy %1$s_equipo on public.%1$s for all using (public.es_miembro()) with check (public.es_miembro())', t);
  end loop;
end $$;

-- clientes: el equipo lee, crea y edita; solo admin borra
drop policy if exists clientes_leer on public.clientes;
create policy clientes_leer on public.clientes for select using (public.es_miembro());
drop policy if exists clientes_crear on public.clientes;
create policy clientes_crear on public.clientes for insert with check (public.es_miembro());
drop policy if exists clientes_editar on public.clientes;
create policy clientes_editar on public.clientes for update using (public.es_miembro()) with check (public.es_miembro());
drop policy if exists clientes_borrar on public.clientes;
create policy clientes_borrar on public.clientes for delete using (public.es_admin());

-- config: el equipo lee, admin edita
drop policy if exists config_leer on public.config;
create policy config_leer on public.config for select using (public.es_miembro());
drop policy if exists config_admin on public.config;
create policy config_admin on public.config for all using (public.es_admin()) with check (public.es_admin());

-- ---------- Archivos (bucket privado "entregas") ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('entregas', 'entregas', false, 52428800)
on conflict (id) do nothing;

drop policy if exists entregas_archivos_leer on storage.objects;
create policy entregas_archivos_leer on storage.objects for select
  using (bucket_id = 'entregas' and public.es_miembro());
drop policy if exists entregas_archivos_subir on storage.objects;
create policy entregas_archivos_subir on storage.objects for insert
  with check (bucket_id = 'entregas' and public.es_miembro());
drop policy if exists entregas_archivos_borrar on storage.objects;
create policy entregas_archivos_borrar on storage.objects for delete
  using (bucket_id = 'entregas' and public.es_miembro());

-- ---------- Tiempo real (chat, tareas, agenda, entregas) ----------
do $$
declare t text;
begin
  foreach t in array array['mensajes','tareas','eventos','entregas','publicaciones','novedades','clientes','miembros','config'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

revoke execute on function public.validar_registro() from public, anon, authenticated;
revoke execute on function public.es_admin() from public, anon;
revoke execute on function public.es_miembro() from public, anon;
revoke execute on function public.mi_id() from public, anon;
grant execute on function public.es_admin() to authenticated;
grant execute on function public.es_miembro() to authenticated;
grant execute on function public.mi_id() to authenticated;

-- ---------- Primer administrador ----------
insert into public.miembros (email, nombre, rol, sede)
values (lower('MAIL_ADMIN'), 'Marcelo Carrizo', 'admin', 'Tucumán')
on conflict (email) do update set rol = 'admin', activo = true;
