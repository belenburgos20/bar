-- ══════════════════════════════════════════════════════════════
--  ey! — Menú Digital · Esquema de base de datos (Supabase / Postgres)
--  Pegá TODO este archivo en:  Supabase → SQL Editor → New query → Run
--  Crea las tablas, las políticas de seguridad y carga el menú actual.
-- ══════════════════════════════════════════════════════════════

-- ─── Limpieza (por si lo corrés más de una vez) ────────────────
drop table if exists items    cascade;
drop table if exists groups   cascade;
drop table if exists promos   cascade;
drop table if exists sections cascade;

-- ─── SECCIONES (categorías del menú) ───────────────────────────
create table sections (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,            -- ancla de navegación (#tablas, #bebidas…)
  eyebrow    text,                            -- texto chico arriba del título
  title      text not null,                   -- título visible
  nav_label  text,                            -- nombre corto en la barra de navegación
  layout     text not null default 'list',    -- 'cards' | 'list' | 'combos' | 'promos'
  alert      text,                            -- aviso al lado del título (opcional)
  note       text,                            -- aviso al pie de la sección (opcional)
  visible    boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ─── GRUPOS (subgrupos de los acordeones: Aperitivos, Clásicos…) ─
create table groups (
  id              uuid primary key default gen_random_uuid(),
  section_id      uuid not null references sections(id) on delete cascade,
  title           text not null,
  subtitle        text,                        -- ej: "Incluyen tapa"
  open_by_default boolean not null default false,
  visible         boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

-- ─── PRODUCTOS ─────────────────────────────────────────────────
create table items (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references sections(id) on delete cascade,
  group_id    uuid references groups(id) on delete cascade,  -- solo en secciones tipo 'list'
  name        text not null,
  price       integer,                          -- en pesos, sin puntos (ej: 22000). Puede ser null.
  description text,                             -- solo tablas (layout 'cards')
  pairing     text,                             -- "Marida con…" (layout 'cards')
  qty         integer,                          -- cantidad para combos (ej: 5 → ×5)
  premium     boolean not null default false,   -- resalta el producto (ej: Rutini)
  featured    boolean not null default false,   -- tarjeta destacada a lo ancho
  visible     boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── PROMOS DE LA NOCHE ────────────────────────────────────────
create table promos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  price       text,                             -- texto libre ("$4.000", "Pagás 1 y tomás 2")
  schedule    text,                             -- horario / vigencia
  drinks      text[] not null default '{}',     -- tragos incluidos
  active      boolean not null default false,   -- si se muestra en el sitio
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── ÍNDICES útiles ────────────────────────────────────────────
create index on items  (section_id);
create index on items  (group_id);
create index on groups (section_id);

-- ══════════════════════════════════════════════════════════════
--  SEGURIDAD (RLS): lectura pública, escritura solo con login
-- ══════════════════════════════════════════════════════════════
alter table sections enable row level security;
alter table groups   enable row level security;
alter table items    enable row level security;
alter table promos   enable row level security;

-- Lectura para cualquiera (los clientes que ven el menú)
create policy "lectura publica sections" on sections for select using (true);
create policy "lectura publica groups"   on groups   for select using (true);
create policy "lectura publica items"    on items    for select using (true);
create policy "lectura publica promos"   on promos   for select using (true);

-- Escritura (insert/update/delete) solo para usuarios logueados (el dueño)
create policy "escritura admin sections" on sections for all to authenticated using (true) with check (true);
create policy "escritura admin groups"   on groups   for all to authenticated using (true) with check (true);
create policy "escritura admin items"    on items    for all to authenticated using (true) with check (true);
create policy "escritura admin promos"   on promos   for all to authenticated using (true) with check (true);

-- ══════════════════════════════════════════════════════════════
--  CARGA DEL MENÚ ACTUAL
-- ══════════════════════════════════════════════════════════════
do $$
declare
  sec_id uuid;
  grp_id uuid;
begin
  -- ─────────────── 1) TABLAS DE TAPEO (cards) ───────────────
  insert into sections (slug, eyebrow, title, nav_label, layout, alert, note, sort_order)
  values ('tablas','Para compartir','Tablas de Tapeo','Tablas','cards',
          'Cada tabla rinde para dos personas.',
          'Consultar por opción vegetariana.', 1)
  returning id into sec_id;

  insert into items (section_id, name, price, description, pairing, sort_order) values
   (sec_id,'Tabla Argenta',22000,
    'Mini choripanes, provoleta grillada, empanaditas criollas, salame y quesos regionales, matambrito arrollado, aceitunas marinadas, pan casero tostado, chimichurri y salsa criolla.',
    'Fernet con Coca · Malbec · Vermut Rosso',1),
   (sec_id,'Tabla Vasca',22000,
    'Tortilla española en cubos, pintxos variados, jamón crudo, quesos estacionados nacionales, croquetas de jamón, aceitunas rellenas, pan tumaca, alioli casero, pimientos asados.',
    'Cabernet · Gin Tonic clásico · Cerveza rubia',2),
   (sec_id,'Tabla Mexicana',22000,
    'Mini tacos de carne o pollo, nachos con cheddar, guacamole casero, alitas BBQ, salsa cheddar, crema agria.',
    'Margarita clásica · Cerveza rubia · Tequila sunrise',3),
   (sec_id,'Tabla Americana',22000,
    'Mini hamburguesas, bastones de mozzarella, papas con cheddar y panceta, alitas BBQ, nuggets de pollo, salsas BBQ, cheddar y honey mustard.',
    'Cerveza IPA · Cuba Libre · Whisky con Coca',4),
   (sec_id,'Tabla Mediterránea',24000,
    'Langostinos fritos en panko, hummus clásico, bruschettas capresse, quesos suaves, aceitunas negras y verdes, tomates cherry, pan pita tostado.',
    'Aperol Spritz · Gin Tonic con limón · Vino blanco',5),
   (sec_id,'Tapeo Libre',19000,null,null,6);

  -- ─────────────── 2) COCTELERÍA (list) ───────────────
  insert into sections (slug, eyebrow, title, nav_label, layout, sort_order)
  values ('bebidas','Bebidas','Coctelería','Bebidas','list',2)
  returning id into sec_id;

  -- Aperitivos
  insert into groups (section_id, title, subtitle, sort_order)
  values (sec_id,'Aperitivos','Incluyen tapa',1) returning id into grp_id;
  insert into items (section_id, group_id, name, price, sort_order) values
   (sec_id,grp_id,'Fernet Cola',9000,1),
   (sec_id,grp_id,'Cynar Julep',8000,2),
   (sec_id,grp_id,'Aperol Sprite',8000,3),
   (sec_id,grp_id,'Gancia',8000,4),
   (sec_id,grp_id,'Dr Lemon Limón',6000,5),
   (sec_id,grp_id,'Dr Lemon Vodka',6000,6),
   (sec_id,grp_id,'Campari Orange',7000,7),
   (sec_id,grp_id,'Campari Tonic',7000,8),
   (sec_id,grp_id,'Negroni',8000,9),
   (sec_id,grp_id,'Aperol Spritz',9000,10),
   (sec_id,grp_id,'Carpano Tonic',7000,11),
   (sec_id,grp_id,'Americano Italiano',7000,12),
   (sec_id,grp_id,'Gancia Batido',8000,13),
   (sec_id,grp_id,'Tinto de Verano',8000,14),
   (sec_id,grp_id,'Ferroviario',8000,15);

  -- Tragos Clásicos
  insert into groups (section_id, title, sort_order)
  values (sec_id,'Tragos Clásicos',2) returning id into grp_id;
  insert into items (section_id, group_id, name, price, sort_order) values
   (sec_id,grp_id,'Laguna Azul',7000,1),
   (sec_id,grp_id,'Caipirinha',7000,2),
   (sec_id,grp_id,'Caipiroska',7000,3),
   (sec_id,grp_id,'Cuba Libre',8000,4),
   (sec_id,grp_id,'Mojito',8000,5),
   (sec_id,grp_id,'Tom Collins',8000,6),
   (sec_id,grp_id,'Sex on the Beach',8000,7),
   (sec_id,grp_id,'Gin Tonic',9000,8),
   (sec_id,grp_id,'Malibú',8000,9),
   (sec_id,grp_id,'Vodka con Jugo',8000,10),
   (sec_id,grp_id,'Vodka con Sprite',8000,11),
   (sec_id,grp_id,'Vodka con Speed',8000,12),
   (sec_id,grp_id,'Whisky con Speed',8000,13),
   (sec_id,grp_id,'Jagermeister con Red Bull',12000,14),
   (sec_id,grp_id,'Jager Julep',9000,15);

  -- Tragos de Postre
  insert into groups (section_id, title, sort_order)
  values (sec_id,'Tragos de Postre',3) returning id into grp_id;
  insert into items (section_id, group_id, name, price, sort_order) values
   (sec_id,grp_id,'Affogato Night',12000,1),
   (sec_id,grp_id,'Cream Baileys',12000,2),
   (sec_id,grp_id,'Brownie Cream',13000,3);

  -- Mocktails
  insert into groups (section_id, title, subtitle, sort_order)
  values (sec_id,'Mocktails','Sin alcohol · Incluyen tapa',4) returning id into grp_id;
  insert into items (section_id, group_id, name, price, sort_order) values
   (sec_id,grp_id,'Pink Lemon',7000,1),
   (sec_id,grp_id,'Mojito Cero',7000,2),
   (sec_id,grp_id,'Blue Fresh',7000,3);

  -- Cervezas
  insert into groups (section_id, title, subtitle, sort_order)
  values (sec_id,'Cervezas','Incluyen tapa',5) returning id into grp_id;
  insert into items (section_id, group_id, name, price, sort_order) values
   (sec_id,grp_id,'Corona 330ml',6000,1),
   (sec_id,grp_id,'Stella 330ml',6000,2),
   (sec_id,grp_id,'Heineken',6000,3),
   (sec_id,grp_id,'Corona Cero 330ml',6000,4),
   (sec_id,grp_id,'Andes IPA 473ml',6000,5),
   (sec_id,grp_id,'Andes Roja 473ml',6000,6);

  -- ─────────────── 3) BODEGA (list) ───────────────
  insert into sections (slug, eyebrow, title, nav_label, layout, sort_order)
  values ('bodega','Vinos','Bodega','Bodega','list',3)
  returning id into sec_id;

  insert into groups (section_id, title, sort_order)
  values (sec_id,'Por Copa',1) returning id into grp_id;
  insert into items (section_id, group_id, name, price, sort_order) values
   (sec_id,grp_id,'Copa Alma Mora',4000,1),
   (sec_id,grp_id,'Copa Santa Julia Chenin Dulce',4000,2),
   (sec_id,grp_id,'Copa Trumpeter Malbec',5000,3),
   (sec_id,grp_id,'Copa Trumpeter Cabernet Sauvignon',5000,4),
   (sec_id,grp_id,'Copa Alambrado Cabernet',5000,5);

  insert into groups (section_id, title, sort_order)
  values (sec_id,'Por Botella',2) returning id into grp_id;
  insert into items (section_id, group_id, name, price, premium, sort_order) values
   (sec_id,grp_id,'Alma Mora',13500,false,1),
   (sec_id,grp_id,'Santa Julia Chenin Dulce',16000,false,2),
   (sec_id,grp_id,'Trumpeter Malbec',22000,false,3),
   (sec_id,grp_id,'Trumpeter Cabernet Sauvignon',22000,false,4),
   (sec_id,grp_id,'Rutini',49000,true,5);

  -- ─────────────── 4) WHISKYS (list) ───────────────
  insert into sections (slug, eyebrow, title, nav_label, layout, sort_order)
  values ('whiskys','Por medida','Whiskys','Whiskys','list',4)
  returning id into sec_id;

  insert into groups (section_id, title, open_by_default, sort_order)
  values (sec_id,'Selección',true,1) returning id into grp_id;
  insert into items (section_id, group_id, name, price, sort_order) values
   (sec_id,grp_id,'J&B',8000,1),
   (sec_id,grp_id,'Jack Daniels',11000,2),
   (sec_id,grp_id,'Johnnie Walker Red',9000,3),
   (sec_id,grp_id,'Johnnie Walker Black',14000,4);

  -- ─────────────── 5) BEBIDAS SIN ALCOHOL (list) ───────────────
  insert into sections (slug, eyebrow, title, nav_label, layout, sort_order)
  values ('gaseosas','Individuales','Bebidas sin alcohol','Gaseosas','list',5)
  returning id into sec_id;

  insert into groups (section_id, title, open_by_default, sort_order)
  values (sec_id,'Selección',true,1) returning id into grp_id;
  insert into items (section_id, group_id, name, price, sort_order) values
   (sec_id,grp_id,'Coca Cola 354ml',3500,1),
   (sec_id,grp_id,'Coca Cola Zero 354ml',3500,2),
   (sec_id,grp_id,'Sprite 354ml',3500,3),
   (sec_id,grp_id,'Tónica',3500,4),
   (sec_id,grp_id,'Speed',4000,5),
   (sec_id,grp_id,'Gancia lata s/alcohol',6000,6),
   (sec_id,grp_id,'Agua saborizada pomelo',2500,7),
   (sec_id,grp_id,'Agua saborizada naranja',2500,8),
   (sec_id,grp_id,'Limonada',2500,9),
   (sec_id,grp_id,'Agua',2000,10);

  -- ─────────────── 6) COMBOS (combos) ───────────────
  insert into sections (slug, eyebrow, title, nav_label, layout, sort_order)
  values ('combos','Para la mesa','Combos para Compartir','Combos','combos',6)
  returning id into sec_id;

  insert into items (section_id, name, qty, price, sort_order) values
   (sec_id,'Fernet + Coca Cola 354ml',5,60000,1),
   (sec_id,'Gancia + Sprite 354ml',5,50000,2),
   (sec_id,'Gin Heredero + Tónica 354ml',5,60000,3),
   (sec_id,'Corona 330ml',5,25000,4),
   (sec_id,'Stella 330ml',5,25000,5),
   (sec_id,'Jagermeister + Red Bull',5,95000,6);

  -- ─────────────── 7) PROMOS DE LA NOCHE (promos) ───────────────
  insert into sections (slug, eyebrow, title, nav_label, layout, sort_order)
  values ('promos','Solo por hoy','Promos de la Noche','Promos','promos',7);

end $$;

-- Promos de ejemplo (desactivadas: el dueño las activa desde el admin cuando quiera)
insert into promos (title, price, schedule, drinks, active, sort_order) values
 ('2x1 en Tragos Clásicos','Pagás 1 y tomás 2','Sábados de 00:00 a 02:00',
  array['Mojito','Caipirinha','Cuba Libre'], false, 1),
 ('2 tragos por $4.000','$4.000','Promo válida esta noche',
  array['Gin Tonic','Fernet Cola'], false, 2);
