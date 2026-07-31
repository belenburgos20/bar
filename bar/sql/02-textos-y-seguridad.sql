-- ══════════════════════════════════════════════════════════════
--  ey! — Migración: textos editables + seguridad del panel
--  ──────────────────────────────────────────────────────────────
--  Pegá TODO este archivo en: Supabase → SQL Editor → New query → Run
--
--  Qué hace:
--    1. Crea site_settings (los textos que el dueño puede editar).
--    2. Crea la lista de administradores y la función is_admin().
--    3. Cambia las políticas de escritura: antes podía escribir CUALQUIER
--       usuario logueado; ahora solo los que estén en la tabla `admins`.
--
--  NO toca sections, groups, items ni promos. Tus datos quedan intactos.
--  Se puede correr más de una vez sin romper nada.
-- ══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
--  1) TEXTOS DEL SITIO
-- ═══════════════════════════════════════════════════════════════
-- Una sola fila (id = 1). El check impide que se creen más por error.
create table if not exists site_settings (
  id             smallint primary key default 1 check (id = 1),
  brand_name     text,
  slogan         text,
  address        text,
  hours          text,
  phone          text,
  instagram_user text,
  instagram_url  text,
  tapa_label     text,
  tapa_price     integer,
  footer_credit  text
);

-- Carga inicial con lo que hoy está escrito a mano en el HTML.
insert into site_settings (
  id, brand_name, slogan, address, hours, phone,
  instagram_user, instagram_url, tapa_label, tapa_price, footer_credit
) values (
  1,
  'Ey! Bar y Copas',
  'Enfocado en lo que suma. Conectado con lo que importa.',
  'Av. Italia y Saavedra, Rio Colorado',
  'Viernes, sábados y feriados · 21:00 – 06:00hs',
  '2920 548412',
  '@eybarycopas',
  'https://instagram.com/eybarycopas',
  'Tapa Individual',
  3200,
  'Hecho por Belén Burgos. Todos los derechos reservados.'
)
on conflict (id) do nothing;

alter table site_settings enable row level security;

-- ═══════════════════════════════════════════════════════════════
--  2) QUIÉN ES ADMINISTRADOR
-- ═══════════════════════════════════════════════════════════════
-- Antes alcanzaba con estar logueado para poder editar el menú. Si algún día
-- se habilita el registro público por accidente, cualquiera podría cambiar
-- los precios. Con esta lista, solo edita quien esté explícitamente acá.
create table if not exists admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- security definer: la función lee `admins` sin quedar atrapada por el RLS
-- de esa misma tabla (si no, se llamaría a sí misma infinitamente).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ═══════════════════════════════════════════════════════════════
--  3) POLÍTICAS DE ACCESO
-- ═══════════════════════════════════════════════════════════════

-- ─── Lectura pública (los clientes que ven el menú) ───
drop policy if exists "lectura publica sections"      on sections;
drop policy if exists "lectura publica groups"        on groups;
drop policy if exists "lectura publica items"         on items;
drop policy if exists "lectura publica promos"        on promos;
drop policy if exists "lectura publica site_settings" on site_settings;

create policy "lectura publica sections"      on sections      for select using (true);
create policy "lectura publica groups"        on groups        for select using (true);
create policy "lectura publica items"         on items         for select using (true);
create policy "lectura publica promos"        on promos        for select using (true);
create policy "lectura publica site_settings" on site_settings for select using (true);

-- ─── Escritura: solo administradores ───
drop policy if exists "escritura admin sections"      on sections;
drop policy if exists "escritura admin groups"        on groups;
drop policy if exists "escritura admin items"         on items;
drop policy if exists "escritura admin promos"        on promos;
drop policy if exists "escritura admin site_settings" on site_settings;

create policy "escritura admin sections" on sections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "escritura admin groups" on groups for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "escritura admin items" on items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "escritura admin promos" on promos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- site_settings: se edita, nunca se crea ni se borra (siempre es la fila 1).
create policy "escritura admin site_settings" on site_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── La lista de admins: se lee desde el panel, se edita solo acá ───
drop policy if exists "lectura admins" on admins;
create policy "lectura admins" on admins for select to authenticated
  using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════
--  4) DAR DE ALTA AL DUEÑO
-- ═══════════════════════════════════════════════════════════════
--  Antes de este paso tenés que haber creado el usuario en:
--    Authentication → Users → Add user → Create new user
--    Email: admin@eybarycopas.com   (el mismo que está en VITE_ADMIN_EMAIL)
--    Password: la que le vas a dar al dueño
--    ✅ Auto Confirm User
--
--  Si usaste otro email, cambialo en las DOS líneas de abajo.
insert into admins (user_id, email)
select id, email from auth.users where email = 'admin@eybarycopas.com'
on conflict (user_id) do nothing;

-- ─── Verificación: tiene que devolver una fila ───
select a.email, a.created_at, 'listo: este usuario puede editar el menú' as estado
from admins a;
