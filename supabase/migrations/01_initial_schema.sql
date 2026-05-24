-- 1. EXTENSIONS & PREREQUISITES
create extension if not exists "uuid-ossp";

-- 2. TABLES DES ROLES & PERMISSIONS
create table public.roles (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Seed default roles
insert into public.roles (name, description) values
  ('administrateur', 'Accès complet au système, configuration, gestion des utilisateurs et validation.'),
  ('employe', 'Consultation du stock, historique et opérations de base autorisées.'),
  ('caissier', 'Accès aux ventes, encaissements, caisse et impression thermique.')
on conflict (name) do nothing;

-- 3. TABLE BOUTIQUES
create table public.boutiques (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  location text,
  created_at timestamp with time zone default now()
);

-- Seed a default boutique
insert into public.boutiques (name, location) values
  ('Aina Pièces Auto - Principal', 'Siège Social, Antananarivo')
on conflict (name) do nothing;

-- 4. PROFILES (Extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role_id uuid references public.roles(id) on delete set null,
  boutique_id uuid references public.boutiques(id) on delete set null,
  created_at timestamp with time zone default now(),
  last_login timestamp with time zone
);

-- Automatic Profile Creation Trigger on Sign Up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role_id, boutique_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    (select id from public.roles where name = 'employe' limit 1), -- default role is 'employe'
    (select id from public.boutiques limit 1) -- assign default boutique
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. PIECES (Catalogue)
create table public.pieces (
  id uuid primary key default uuid_generate_v4(),
  reference text not null unique,
  designation text not null,
  marque text,
  categorie text,
  compatibilite text,
  oem_number text,
  description text,
  photo_url text,
  created_at timestamp with time zone default now()
);

-- 6. STOCK (Quantity per piece per boutique)
create table public.stock (
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

-- 7. FOURNISSEURS
create table public.fournisseurs (
  id uuid primary key default uuid_generate_v4(),
  nom text not null unique,
  contact text,
  adresse text,
  created_at timestamp with time zone default now()
);

-- 8. PIECE_FOURNISSEURS (Comparison list)
create table public.piece_fournisseurs (
  id uuid primary key default uuid_generate_v4(),
  piece_id uuid references public.pieces(id) on delete cascade not null,
  fournisseur_id uuid references public.fournisseurs(id) on delete cascade not null,
  prix_achat numeric(12,2) not null,
  created_at timestamp with time zone default now(),
  unique (piece_id, fournisseur_id)
);

-- 9. HISTORIQUE_PRIX_FOURNISSEUR (For price charts and comparison)
create table public.historique_prix_fournisseur (
  id uuid primary key default uuid_generate_v4(),
  piece_fournisseur_id uuid references public.piece_fournisseurs(id) on delete cascade not null,
  prix_achat numeric(12,2) not null,
  recorded_at timestamp with time zone default now()
);

-- 10. ACHATS (Purchase Orders)
create table public.achats (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references public.boutiques(id) on delete set null,
  utilisateur_id uuid references public.profiles(id) on delete set null,
  total numeric(12,2) default 0.00,
  created_at timestamp with time zone default now()
);

-- 11. DETAILS_ACHATS
create table public.details_achats (
  id uuid primary key default uuid_generate_v4(),
  achat_id uuid references public.achats(id) on delete cascade not null,
  piece_id uuid references public.pieces(id) on delete restrict not null,
  quantite integer not null,
  prix_unitaire numeric(12,2) not null,
  remise numeric(5,2) default 0.00,
  total numeric(12,2) not null
);

-- 12. VENTES (Sales)
create table public.ventes (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references public.boutiques(id) on delete set null,
  caissier_id uuid references public.profiles(id) on delete set null,
  total numeric(12,2) default 0.00,
  created_at timestamp with time zone default now()
);

-- 13. DETAILS_VENTES
create table public.details_ventes (
  id uuid primary key default uuid_generate_v4(),
  vente_id uuid references public.ventes(id) on delete cascade not null,
  piece_id uuid references public.pieces(id) on delete restrict not null,
  quantite integer not null,
  prix_vente numeric(12,2) not null,
  remise numeric(5,2) default 0.00,
  total numeric(12,2) not null
);

-- 14. MOUVEMENTS_STOCK (Audit log for stock movements)
create table public.mouvements_stock (
  id uuid primary key default uuid_generate_v4(),
  stock_id uuid references public.stock(id) on delete cascade not null,
  type text check (type in ('ENTREE', 'SORTIE')) not null,
  quantite integer not null,
  utilisateur_id uuid references public.profiles(id) on delete set null,
  commentaire text,
  created_at timestamp with time zone default now()
);

-- 15. DEPENSES (Expenses)
create table public.depenses (
  id uuid primary key default uuid_generate_v4(),
  boutique_id uuid references public.boutiques(id) on delete set null,
  montant numeric(12,2) not null,
  description text not null,
  utilisateur_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- 16. CAISSE (Cash Register tracking)
create table public.caisse (
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

-- 17. IMPORT_LOGS (Audit excel imports)
create table public.import_logs (
  id uuid primary key default uuid_generate_v4(),
  fichier_name text not null,
  statut text check (statut in ('SUCCESS', 'FAIL', 'PARTIAL')) not null,
  details jsonb,
  created_at timestamp with time zone default now()
);

-- 18. USER_ACTIVITY_LOGS (Security tracking)
create table public.user_activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- 19. ENABLE ROW LEVEL SECURITY (RLS)
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
alter table public.mouvements_stock enable row level security;
alter table public.depenses enable row level security;
alter table public.caisse enable row level security;
alter table public.import_logs enable row level security;
alter table public.user_activity_logs enable row level security;

-- 20. RLS POLICIES (Allow read to all authenticated users, write to admins)
-- (Simplification layer for quick deployment, easily customizable in settings)
create policy "Allow read for authenticated" on public.roles for select to authenticated using (true);
create policy "Allow read for authenticated" on public.boutiques for select to authenticated using (true);
create policy "Allow read/write for all users" on public.profiles for all to authenticated using (true);
create policy "Allow read for authenticated" on public.pieces for select to authenticated using (true);
create policy "Allow read for authenticated" on public.stock for select to authenticated using (true);
create policy "Allow read for authenticated" on public.fournisseurs for select to authenticated using (true);

-- Admin full access to everything
create policy "Admin full access roles" on public.roles for all to authenticated using (
  exists (select 1 from public.profiles p join public.roles r on p.role_id = r.id where p.id = auth.uid() and r.name = 'administrateur')
);
create policy "Admin full access boutiques" on public.boutiques for all to authenticated using (
  exists (select 1 from public.profiles p join public.roles r on p.role_id = r.id where p.id = auth.uid() and r.name = 'administrateur')
);
create policy "Admin full access pieces" on public.pieces for all to authenticated using (
  exists (select 1 from public.profiles p join public.roles r on p.role_id = r.id where p.id = auth.uid() and r.name = 'administrateur')
);
create policy "Admin full access stock" on public.stock for all to authenticated using (
  exists (select 1 from public.profiles p join public.roles r on p.role_id = r.id where p.id = auth.uid() and r.name = 'administrateur')
);
create policy "Admin full access fournisseurs" on public.fournisseurs for all to authenticated using (
  exists (select 1 from public.profiles p join public.roles r on p.role_id = r.id where p.id = auth.uid() and r.name = 'administrateur')
);

-- Open other tables for general operations (restricted by code role validations)
create policy "Authenticated all access on stock details" on public.piece_fournisseurs for all to authenticated using (true);
create policy "Authenticated all access on price history" on public.historique_prix_fournisseur for all to authenticated using (true);
create policy "Authenticated all access on achats" on public.achats for all to authenticated using (true);
create policy "Authenticated all access on details_achats" on public.details_achats for all to authenticated using (true);
create policy "Authenticated all access on ventes" on public.ventes for all to authenticated using (true);
create policy "Authenticated all access on details_ventes" on public.details_ventes for all to authenticated using (true);
create policy "Authenticated all access on mouvements_stock" on public.mouvements_stock for all to authenticated using (true);
create policy "Authenticated all access on depenses" on public.depenses for all to authenticated using (true);
create policy "Authenticated all access on caisse" on public.caisse for all to authenticated using (true);
create policy "Authenticated all access on import_logs" on public.import_logs for all to authenticated using (true);
create policy "Authenticated all access on user_activity_logs" on public.user_activity_logs for all to authenticated using (true);
