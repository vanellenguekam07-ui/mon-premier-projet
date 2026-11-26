-- ═══════════════════════════════════════════════════════════════
-- LV SURPRISE EVENT — Schéma de la base (Supabase / PostgreSQL)
-- ───────────────────────────────────────────────────────────────
-- ⚠️ Ce fichier est la RÉFÉRENCE du schéma, pas à rejouer en entier :
-- le projet est déjà configuré (projet « lv-surprise-event »).
-- À utiliser uniquement pour recréer la base ailleurs (nouveau projet).
--
-- Modèle de sécurité :
--   • le navigateur n'a que la clé « publishable » (publique) ;
--   • les mots de passe sont hachés en bcrypt côté serveur (pgcrypto) ;
--   • la connexion renvoie un jeton opaque stocké dans admin_sessions ;
--   • chaque requête d'admin envoie ce jeton dans l'en-tête « x-admin-token » ;
--   • les règles RLS interrogent la base pour savoir si l'appelant est
--     admin (is_admin()) ou super admin (is_super()) → les rôles sont
--     réellement appliqués par PostgreSQL, pas par le navigateur.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;   -- bcrypt + jetons aléatoires

-- ─────────── COMPTES ADMINISTRATEURS ───────────
create table if not exists public.admins (
  username text primary key,
  password_hash text,                       -- bcrypt (jamais de mot de passe en clair)
  role text not null check (role in ('super', 'manager')),
  name text not null default '',
  title text not null default '',
  must_change_password boolean not null default true,
  failed_attempts int not null default 0,   -- anti-bruteforce
  locked_until timestamptz
);

create table if not exists public.admin_sessions (
  token text primary key,
  username text not null references public.admins(username) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- ─────────── DONNÉES MÉTIER ───────────
-- Commandes : lecture réservée aux admins ; le client ne peut qu'envoyer la sienne.
create table if not exists public.orders (
  id bigint primary key,
  ref text not null unique,
  client text not null,
  phone text not null,
  location text not null default '',
  date date not null,
  time text default '',
  recipient text default '',
  message text default '',
  items jsonb not null default '[]'::jsonb,
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
  id bigint primary key,
  date date not null default current_date,
  type text not null,                       -- recette | depense
  category text not null default 'Autre',
  label text not null default '',
  amount integer not null default 0,
  ref text,
  created_at timestamptz not null default now()
);

create table if not exists public.providers (
  id bigint primary key,
  name text not null,
  skill text not null default '',
  phone text not null default '',
  cost integer not null default 0,
  created_at timestamptz not null default now()
);

-- Contenus publics, clé/valeur :
--   'site'     → textes, photos, coordonnées, moyens de paiement
--   'catalog'  → gâteaux + prestations (noms, prix, badges, photos)
--   'settings' → acompte %, remise pack, coût musiciens
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ─────────── FONCTIONS DE RÔLE ───────────
create or replace function public.req_header(p_name text) returns text
language sql stable as $$
  select nullif(coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json ->> p_name, '')
$$;

create or replace function public.actor_username() returns text
language sql stable security definer set search_path = public as $$
  select s.username from public.admin_sessions s
  where s.token = public.req_header('x-admin-token') and s.expires_at > now()
$$;

create or replace function public.actor_role() returns text
language sql stable security definer set search_path = public as $$
  select a.role from public.admin_sessions s
  join public.admins a on a.username = s.username
  where s.token = public.req_header('x-admin-token') and s.expires_at > now()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.actor_username() is not null
$$;

create or replace function public.is_super() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.actor_role() = 'super', false)
$$;

-- ─────────── AUTHENTIFICATION ───────────
-- admin_login / admin_me / admin_logout / admin_change_password
-- admin_list_users / admin_save_user / admin_delete_user
-- track_order  (suivi client : référence + téléphone obligatoires)
-- → corps complet : voir l'historique des migrations du projet Supabase.

-- ─────────── RÈGLES D'ACCÈS (RLS) ───────────
alter table public.admins enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.transactions enable row level security;
alter table public.providers enable row level security;
alter table public.site_content enable row level security;

-- Commandes : tout le monde peut en créer une, seuls les admins les lisent.
create policy "orders insert public" on public.orders for insert to anon, authenticated with check (true);
create policy "orders read admin" on public.orders for select to anon, authenticated using (public.is_admin());
create policy "orders update admin" on public.orders for update to anon, authenticated using (public.is_admin()) with check (public.is_admin());
create policy "orders delete super" on public.orders for delete to anon, authenticated using (public.is_super());

-- Finances / prestataires : admins en lecture-écriture, suppression = super.
create policy "tx read admin" on public.transactions for select to anon, authenticated using (public.is_admin());
create policy "tx insert admin" on public.transactions for insert to anon, authenticated with check (public.is_admin());
create policy "tx update admin" on public.transactions for update to anon, authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tx delete super" on public.transactions for delete to anon, authenticated using (public.is_super());

create policy "providers read admin" on public.providers for select to anon, authenticated using (public.is_admin());
create policy "providers insert admin" on public.providers for insert to anon, authenticated with check (public.is_admin());
create policy "providers update admin" on public.providers for update to anon, authenticated using (public.is_admin()) with check (public.is_admin());
create policy "providers delete super" on public.providers for delete to anon, authenticated using (public.is_super());

-- Contenus du site : lecture publique, écriture réservée au Super Admin.
create policy "site read public" on public.site_content for select to anon, authenticated using (true);
create policy "site insert super" on public.site_content for insert to anon, authenticated with check (public.is_super());
create policy "site update super" on public.site_content for update to anon, authenticated using (public.is_super()) with check (public.is_super());
create policy "site delete super" on public.site_content for delete to anon, authenticated using (public.is_super());

-- admin_sessions et admins : AUCUNE politique → accès direct refusé.
-- On passe obligatoirement par les fonctions SECURITY DEFINER ci-dessus.
