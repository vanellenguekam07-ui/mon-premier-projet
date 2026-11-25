-- ═══════════════════════════════════════════════════════════════════
--  LV SURPRISE EVENT — Schéma Supabase (à exécuter à l'hébergement)
--  Mode d'emploi : Supabase Dashboard → SQL Editor → New query → coller
--  ce fichier → Run. Les politiques RLS ci-dessous sont un point de
--  départ : à durcir avant l'ouverture publique (voir DEPLOY.md).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  ref text unique not null,
  client text not null,
  phone text not null,
  location text not null,
  date date not null,
  time text,
  recipient text,
  message text default '',
  items jsonb not null default '[]',
  subtotal integer not null default 0,
  discount integer not null default 0,
  total integer not null default 0,
  acompte integer not null default 0,
  solde integer not null default 0,
  pay_status text not null default 'Non payé',
  status text not null default 'En attente',
  has_music boolean not null default false,
  musician_paid boolean not null default false,
  musician_cost integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  date date not null,
  type text not null check (type in ('recette','depense')),
  category text not null default 'Autre',
  label text not null,
  amount integer not null default 0,
  ref text,
  created_at timestamptz not null default now()
);

create table if not exists public.providers (
  id bigint generated always as identity primary key,
  name text not null,
  skill text not null default '',
  phone text default '',
  cost integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog (
  id text primary key,          -- ex: 'g1', 'deco', 'c1712345678901'
  kind text not null check (kind in ('gateau','prestation')),
  name text not null,
  price integer not null default 0,
  img text default '',
  badge text default '',
  rose boolean not null default false,
  descr text default '',
  includes text default '',
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  key text primary key,         -- 'site', 'settings'
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  username text primary key,
  password_hash text not null,  -- SHA-256 salé côté application (voir js/app.js)
  role text not null check (role in ('super','manager')),
  name text not null default '',
  title text not null default '',
  must_change_password boolean not null default true
);

-- ── Sécurité Row Level Security ───────────────────────────────────
alter table public.orders        enable row level security;
alter table public.transactions  enable row level security;
alter table public.providers     enable row level security;
alter table public.catalog       enable row level security;
alter table public.site_content  enable row level security;
alter table public.admins        enable row level security;

-- Lecture publique du catalogue et des contenus (vitrine)
create policy "catalog public read" on public.catalog
  for select using (true);
create policy "site public read" on public.site_content
  for select using (true);

-- Commandes : insertion publique (le client crée sa réservation),
-- lecture/écriture réservée aux comptes authentifiés (admin).
create policy "orders public insert" on public.orders
  for insert with check (true);
create policy "orders admin all" on public.orders
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Finances / prestataires / admins : admin uniquement.
create policy "tx admin all" on public.transactions
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create policy "providers admin all" on public.providers
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create policy "admins admin all" on public.admins
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Catalogue / contenus : écriture admin uniquement.
create policy "catalog admin write" on public.catalog
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create policy "site admin write" on public.site_content
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ⚠️ AVANT L'OUVERTURE PUBLIQUE : créer les comptes admin dans
-- Supabase Auth (Authentication → Users), désactiver l'inscription
-- publique (Authentication → Providers → Email → "Allow new users
-- to sign up" = OFF), et tester chaque politique avec un compte
-- anonyme et un compte admin.
