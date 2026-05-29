-- ============================================================
-- AINA PIÈCE AUTO — SCHÉMA COMPLET ET À JOUR
-- Version : 2.0 — Mise à jour 30/05/2026
-- Ce script crée la base de données complète depuis zéro.
-- Exécuter dans l'éditeur SQL de Supabase (une seule fois).
-- ============================================================

-- 1. EXTENSIONS & PREREQUISITES
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. TABLES DES ROLES & PERMISSIONS
-- ============================================================
create table if not exists public.roles (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  created_at timestamp with time zone default now()
);

insert into public.roles (name, description) values
  ('administrateur', 'Accès complet au système, configuration, gestion des utilisateurs et validation.'),
  ('employe', 'Consultation du stock, historique et opérations de base autorisées.'),
  ('caissier', 'Accès aux ventes, encaissements, caisse et impression thermique.')
on conflict (name) do nothing;

-- ============================================================
-- 3. TABLE BOUTIQUES
-- ============================================================
create table if not exists public.boutiques (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  location text,
  created_at timestamp with time zone default now()
);

insert into public.boutiques (name, location) values
  ('Boutique Principale', 'Analakely, Antananarivo')
on conflict (name) do nothing;

-- ============================================================
-- 4. PROFILES (Étend auth.users de Supabase)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role_id uuid references public.roles(id) on delete set null,
  boutique_id uuid references public.boutiques(id) on delete set null,
  created_at timestamp with time zone default now(),
  last_login timestamp with time zone  -- Utilisé pour le heartbeat "En ligne" (mis à jour toutes les 5 min)
);

-- Trigger : crée automatiquement un profil après inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role_id, boutique_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    (select id from public.roles where name = 'employe' limit 1),
    (select id from public.boutiques limit 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 5. PIECES (Catalogue)
-- IMPORTANT : code_barre, prix_vente, prix_achat SONT REQUIS
-- ============================================================
create table if not exists public.pieces (
  id uuid primary key default uuid_generate_v4(),
  reference text not null unique,
  designation text not null,
  marque text,
  categorie text,
  compatibilite text,
  oem_number text,
  description text,
  photo_url text,
  code_barre text,                         -- Code-barres pour la douchette (EAN-13, etc.)
  prix_achat numeric(12,2) default 0.00,   -- Dernier prix d'achat connu
  prix_vente numeric(12,2) default 0.00,   -- Prix de vente affiché en caisse
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 6. STOCK (Quantité par pièce par boutique)
-- ============================================================
create table if not exists public.stock (
  id uuid primary key default uuid_generate_v4(),
  piece_id uuid references public.pieces(id) on delete cascade not null,
  boutique_id uuid references public.boutiques(id) on delete cascade not null,
  quantity_achetee integer default 0,
  quantity_disponible integer default 0,
  stock_minimum integer default 5,
  emplacement text,
  date_arrive timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  unique (piece_id, boutique_id)
);

-- ============================================================
-- 7. FOURNISSEURS
-- ============================================================
create table if not exists public.fournisseurs (
  id uuid primary key default uuid_generate_v4(),
  nom text not null unique,
  contact text,
  adresse text,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 8. PIECE_FOURNISSEURS (Comparaison prix fournisseurs)
-- ============================================================
create table if not exists public.piece_fournisseurs (
  id uuid primary key default uuid_generate_v4(),
  piece_id uuid references public.pieces(id) on delete cascade not null,
  fournisseur_id uuid references public.fournisseurs(id) on delete cascade not null,
  prix_achat numeric(12,2) not null,
  created_at timestamp with time zone default now(),
  unique (piece_id, fournisseur_id)
);

-- ============================================================
-- 9. HISTORIQUE_PRIX_FOURNISSEUR (Graphiques d'évolution des prix)
-- ============================================================
create table if not exists public.historique_prix_fournisseur (
  id uuid primary key default uuid_generate_v4(),
  piece_fournisseur_id uuid references public.piece_fournisseurs(id) on delete cascade not null,
  prix_achat numeric(12,2) not null,
  recorded_at timestamp with time zone default now()
);

-- ============================================================
-- 10. ACHATS (Bons de commande / réception)
-- ============================================================
create table if not exists public.achats (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references public.boutiques(id) on delete set null,
  utilisateur_id uuid references public.profiles(id) on delete set null,
  total numeric(12,2) default 0.00,
  created_at timestamp with time zone default now()
);

-- 11. DETAILS_ACHATS
create table if not exists public.details_achats (
  id uuid primary key default uuid_generate_v4(),
  achat_id uuid references public.achats(id) on delete cascade not null,
  piece_id uuid references public.pieces(id) on delete restrict not null,
  quantite integer not null,
  prix_unitaire numeric(12,2) not null,
  remise numeric(5,2) default 0.00,
  total numeric(12,2) not null
);

-- ============================================================
-- 12. VENTES (Tickets de caisse)
-- IMPORTANT : statut_paiement, espece_recue, boutique_name SONT REQUIS
-- ============================================================
create table if not exists public.ventes (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references public.boutiques(id) on delete set null,
  caissier_id uuid references public.profiles(id) on delete set null,
  total numeric(12,2) default 0.00,
  statut_paiement text default 'COMPTANT',  -- 'COMPTANT' | 'CREDIT' | 'PARTIEL'
  espece_recue numeric(12,2) default 0.00,  -- Montant remis par le client
  monnaie_rendue numeric(12,2) default 0.00, -- Rendu de monnaie
  boutique_name text,                        -- Nom boutique figé sur le ticket thermique
  vendeur text,                              -- Nom caissier figé sur le ticket thermique
  client_id uuid,                            -- Référence au client si CREDIT
  created_at timestamp with time zone default now()
);

-- 13. DETAILS_VENTES
create table if not exists public.details_ventes (
  id uuid primary key default uuid_generate_v4(),
  vente_id uuid references public.ventes(id) on delete cascade not null,
  piece_id uuid references public.pieces(id) on delete restrict not null,
  quantite integer not null,
  prix_vente numeric(12,2) not null,
  remise numeric(5,2) default 0.00,
  total numeric(12,2) not null
);

-- ============================================================
-- 14. CLIENTS & CRÉDITS (Garages partenaires avec dettes)
-- ============================================================
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  telephone text,
  adresse text,
  boutique_id uuid references public.boutiques(id) on delete set null,
  total_dette numeric(12,2) default 0.00,    -- Calculé = somme ventes CREDIT non soldées
  created_at timestamp with time zone default now()
);

-- 15. REGLEMENTS_CREDITS (Encaissements partiels sur dettes)
create table if not exists public.reglements_credits (
  id uuid primary key default uuid_generate_v4(),
  vente_id uuid references public.ventes(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  montant numeric(12,2) not null,
  note text,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 16. MOUVEMENTS_STOCK (Audit log des mouvements de stock)
-- ============================================================
create table if not exists public.mouvements_stock (
  id uuid primary key default uuid_generate_v4(),
  stock_id uuid references public.stock(id) on delete cascade not null,
  type text check (type in ('ENTREE', 'SORTIE')) not null,
  quantite integer not null,
  utilisateur_id uuid references public.profiles(id) on delete set null,
  commentaire text,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 17. DEPENSES (Charges et frais)
-- ============================================================
create table if not exists public.depenses (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references public.boutiques(id) on delete set null,
  montant numeric(12,2) not null,
  description text not null,
  utilisateur_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 18. CAISSE (Suivi ouverture/fermeture)
-- ============================================================
create table if not exists public.caisse (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references public.boutiques(id) on delete cascade not null,
  montant_debut numeric(12,2) default 0.00,
  montant_fin numeric(12,2) default 0.00,
  statut text check (statut in ('OUVERT', 'FERME')) default 'OUVERT',
  ouvert_par uuid references public.profiles(id),
  ferme_par uuid references public.profiles(id),
  date_ouverture timestamp with time zone default now(),
  date_fermeture timestamp with time zone
);

-- ============================================================
-- 19. BOUTIQUE_SETTINGS (Paramètres personnalisés par boutique)
-- Horaires, personnalisation de l'interface, etc.
-- ============================================================
create table if not exists public.boutique_settings (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references public.boutiques(id) on delete cascade,
  key text not null,        -- Ex: 'open_time', 'close_time', 'logo_url', 'address', 'phone'
  value text,
  created_at timestamp with time zone default now(),
  unique (boutique_id, key)
);

-- ============================================================
-- 20. PAGE_PERMISSIONS (Matrice des autorisations par boutique/utilisateur)
-- ============================================================
create table if not exists public.page_permissions (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,   -- Ex: '{boutique_id}_{page_id}' ou '{user_id}_{page_id}'
  value boolean default true,
  updated_at timestamp with time zone default now()
);

-- ============================================================
-- 21. IMPORT_LOGS (Audit imports Excel)
-- ============================================================
create table if not exists public.import_logs (
  id uuid primary key default uuid_generate_v4(),
  fichier_name text not null,
  statut text check (statut in ('SUCCESS', 'FAIL', 'PARTIAL')) not null,
  details jsonb,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 22. USER_ACTIVITY_LOGS (Sécurité et traçabilité)
-- ============================================================
create table if not exists public.user_activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 23. FONCTION DE SUPPRESSION DES UTILISATEURS (Hard Reset)
-- Permet de supprimer les comptes auth sans supprimer l'admin
-- ============================================================
create or replace function public.delete_non_admin_users(admin_email text)
returns void as $$
declare
  user_record record;
begin
  for user_record in
    select id from auth.users where email != admin_email
  loop
    delete from auth.users where id = user_record.id;
  end loop;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 24. ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.roles enable row level security;
alter table public.boutiques enable row level security;
alter table public.profiles enable row level security;
alter table public.pieces enable row level security;
alter table public.stock enable row level security;
alter table public.fournisseurs enable row level security;
alter table public.piece_fournisseurs enable row level security;
alter table public.historique_prix_fournisseur enable row level security;
alter table public.achats enable row level security;
alter table public.details_achats enable row level security;
alter table public.ventes enable row level security;
alter table public.details_ventes enable row level security;
alter table public.clients enable row level security;
alter table public.reglements_credits enable row level security;
alter table public.mouvements_stock enable row level security;
alter table public.depenses enable row level security;
alter table public.caisse enable row level security;
alter table public.boutique_settings enable row level security;
alter table public.page_permissions enable row level security;
alter table public.import_logs enable row level security;
alter table public.user_activity_logs enable row level security;

-- ============================================================
-- 25. POLITIQUES RLS
-- ============================================================

-- Lecture universelle (tables de référence)
create policy "Lecture authentifiée" on public.roles for select to authenticated using (true);
create policy "Lecture authentifiée" on public.boutiques for select to authenticated using (true);
create policy "Lecture/Écriture profils" on public.profiles for all to authenticated using (true);
create policy "Lecture authentifiée" on public.pieces for select to authenticated using (true);
create policy "Lecture authentifiée" on public.stock for select to authenticated using (true);
create policy "Lecture authentifiée" on public.fournisseurs for select to authenticated using (true);

-- Accès complet admin (via jointure sur le rôle)
create policy "Admin : accès total roles" on public.roles for all to authenticated using (
  exists (select 1 from public.profiles p join public.roles r on p.role_id = r.id where p.id = auth.uid() and r.name = 'administrateur')
);
create policy "Admin : accès total boutiques" on public.boutiques for all to authenticated using (
  exists (select 1 from public.profiles p join public.roles r on p.role_id = r.id where p.id = auth.uid() and r.name = 'administrateur')
);
create policy "Admin : accès total pieces" on public.pieces for all to authenticated using (
  exists (select 1 from public.profiles p join public.roles r on p.role_id = r.id where p.id = auth.uid() and r.name = 'administrateur')
);
create policy "Admin : accès total stock" on public.stock for all to authenticated using (
  exists (select 1 from public.profiles p join public.roles r on p.role_id = r.id where p.id = auth.uid() and r.name = 'administrateur')
);
create policy "Admin : accès total fournisseurs" on public.fournisseurs for all to authenticated using (
  exists (select 1 from public.profiles p join public.roles r on p.role_id = r.id where p.id = auth.uid() and r.name = 'administrateur')
);

-- Accès authentifié général (contrôle métier géré dans le code)
create policy "Accès général : piece_fournisseurs" on public.piece_fournisseurs for all to authenticated using (true);
create policy "Accès général : historique_prix" on public.historique_prix_fournisseur for all to authenticated using (true);
create policy "Accès général : achats" on public.achats for all to authenticated using (true);
create policy "Accès général : details_achats" on public.details_achats for all to authenticated using (true);
create policy "Accès général : ventes" on public.ventes for all to authenticated using (true);
create policy "Accès général : details_ventes" on public.details_ventes for all to authenticated using (true);
create policy "Accès général : clients" on public.clients for all to authenticated using (true);
create policy "Accès général : reglements_credits" on public.reglements_credits for all to authenticated using (true);
create policy "Accès général : mouvements_stock" on public.mouvements_stock for all to authenticated using (true);
create policy "Accès général : depenses" on public.depenses for all to authenticated using (true);
create policy "Accès général : caisse" on public.caisse for all to authenticated using (true);
create policy "Accès général : boutique_settings" on public.boutique_settings for all to authenticated using (true);
create policy "Accès général : page_permissions" on public.page_permissions for all to authenticated using (true);
create policy "Accès général : import_logs" on public.import_logs for all to authenticated using (true);
create policy "Accès général : user_activity_logs" on public.user_activity_logs for all to authenticated using (true);
