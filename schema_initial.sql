-- ==============================================================================
-- 🚀 SCHEMA INITIAL - ERP GESTION BOUTIQUE AUTO
-- ==============================================================================
-- Ce script crée toute la base de données vierge pour un nouveau client.
-- 
-- INSTRUCTIONS (nouveau client) :
-- 1. Créez un nouveau projet sur https://supabase.com
-- 2. Allez dans SQL Editor → New Query
-- 3. Copiez-collez ce fichier entier et cliquez sur RUN
-- 4. Ensuite, exécutez supabase_rls_lock.sql pour activer la sécurité
-- 5. Mettez à jour les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
--    dans le fichier .env du projet React
-- ==============================================================================

-- ==============================================================================
-- ÉTAPE 1 : TABLES DE BASE (Référentiels)
-- ==============================================================================

-- TABLE : ROLES
-- Les rôles possibles dans l'application (administrateur, caissier, etc.)
CREATE TABLE IF NOT EXISTS public.roles (
  id   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE
);

-- Données initiales des rôles
INSERT INTO public.roles (name) VALUES 
  ('administrateur'),
  ('caissier')
ON CONFLICT (name) DO NOTHING;


-- TABLE : BOUTIQUES
-- Les points de vente physiques du client
CREATE TABLE IF NOT EXISTS public.boutiques (
  id       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name     text NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);


-- TABLE : PROFILES
-- Profil de chaque utilisateur (lié à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  email       text,
  role_id     uuid REFERENCES public.roles(id),
  boutique_id uuid REFERENCES public.boutiques(id) ON DELETE SET NULL,
  last_login  timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now()
);

-- Trigger : crée automatiquement un profil vide dès qu'un utilisateur s'inscrit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- TABLE : APP_SETTINGS
-- Stocke la matrice des autorisations (cloud sync entre appareils)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        text PRIMARY KEY,
  value      jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Valeur initiale vide de la matrice
INSERT INTO public.app_settings (key, value) 
  VALUES ('page_permissions', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ==============================================================================
-- ÉTAPE 2 : CATALOGUE DE PIÈCES
-- ==============================================================================

-- TABLE : FOURNISSEURS
CREATE TABLE IF NOT EXISTS public.fournisseurs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom        text NOT NULL,
  contact    text,
  telephone  text,
  email      text,
  adresse    text,
  created_at timestamptz DEFAULT now()
);


-- TABLE : PIECES
-- Le catalogue central de toutes les pièces automobiles
CREATE TABLE IF NOT EXISTS public.pieces (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reference     text UNIQUE NOT NULL,
  designation   text NOT NULL,
  marque        text,
  categorie     text,
  compatibilite text,
  oem_number    text,
  description   text,
  prix_achat    numeric(12, 2) DEFAULT 0,
  prix_vente    numeric(12, 2) DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);


-- TABLE : STOCK
-- Quantités disponibles par pièce ET par boutique
CREATE TABLE IF NOT EXISTS public.stock (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  piece_id            uuid NOT NULL REFERENCES public.pieces(id) ON DELETE CASCADE,
  boutique_id         uuid NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  quantity_achetee    integer DEFAULT 0,
  quantity_disponible integer DEFAULT 0,
  seuil_alerte        integer DEFAULT 5,
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (piece_id, boutique_id)
);


-- TABLE : PIECE_FOURNISSEURS
-- Table de liaison entre pièces et fournisseurs (avec prix d'achat du fournisseur)
CREATE TABLE IF NOT EXISTS public.piece_fournisseurs (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  piece_id      uuid NOT NULL REFERENCES public.pieces(id) ON DELETE CASCADE,
  fournisseur_id uuid NOT NULL REFERENCES public.fournisseurs(id) ON DELETE CASCADE,
  prix_achat    numeric(12, 2) DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (piece_id, fournisseur_id)
);


-- ==============================================================================
-- ÉTAPE 3 : TRANSACTIONS COMMERCIALES
-- ==============================================================================

-- TABLE : VENTES
-- En-tête de chaque vente (ticket de caisse)
CREATE TABLE IF NOT EXISTS public.ventes (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  boutique_id  uuid REFERENCES public.boutiques(id) ON DELETE SET NULL,
  ouvert_par   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  total        numeric(12, 2) DEFAULT 0,
  benefice     numeric(12, 2) DEFAULT 0,
  note         text,
  created_at   timestamptz DEFAULT now()
);


-- TABLE : DETAILS_VENTES
-- Détail de chaque ligne d'une vente (quelle pièce, quelle quantité)
CREATE TABLE IF NOT EXISTS public.details_ventes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vente_id    uuid NOT NULL REFERENCES public.ventes(id) ON DELETE CASCADE,
  piece_id    uuid REFERENCES public.pieces(id) ON DELETE SET NULL,
  quantite    integer NOT NULL DEFAULT 1,
  prix_vente  numeric(12, 2) NOT NULL DEFAULT 0,
  prix_achat  numeric(12, 2) DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);


-- TABLE : ACHATS
-- En-tête de chaque achat auprès d'un fournisseur
CREATE TABLE IF NOT EXISTS public.achats (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  boutique_id     uuid REFERENCES public.boutiques(id) ON DELETE SET NULL,
  fournisseur_id  uuid REFERENCES public.fournisseurs(id) ON DELETE SET NULL,
  ouvert_par      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  total           numeric(12, 2) DEFAULT 0,
  note            text,
  created_at      timestamptz DEFAULT now()
);


-- TABLE : DETAILS_ACHATS
-- Détail de chaque ligne d'un achat
CREATE TABLE IF NOT EXISTS public.details_achats (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  achat_id   uuid NOT NULL REFERENCES public.achats(id) ON DELETE CASCADE,
  piece_id   uuid REFERENCES public.pieces(id) ON DELETE SET NULL,
  quantite   integer NOT NULL DEFAULT 1,
  prix_achat numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);


-- TABLE : CAISSE
-- Suivi du solde de la caisse par boutique
CREATE TABLE IF NOT EXISTS public.caisse (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  boutique_id uuid REFERENCES public.boutiques(id) ON DELETE SET NULL,
  montant     numeric(12, 2) DEFAULT 0,
  type        text CHECK (type IN ('entree', 'sortie')),
  motif       text,
  created_at  timestamptz DEFAULT now()
);


-- TABLE : DEPENSES
-- Dépenses opérationnelles de chaque boutique
CREATE TABLE IF NOT EXISTS public.depenses (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  boutique_id uuid REFERENCES public.boutiques(id) ON DELETE SET NULL,
  montant     numeric(12, 2) NOT NULL DEFAULT 0,
  motif       text,
  categorie   text,
  created_at  timestamptz DEFAULT now()
);


-- ==============================================================================
-- ÉTAPE 4 : INDEX DE PERFORMANCE
-- (Accélèrent les requêtes les plus fréquentes)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_ventes_boutique_id    ON public.ventes(boutique_id);
CREATE INDEX IF NOT EXISTS idx_ventes_created_at     ON public.ventes(created_at);
CREATE INDEX IF NOT EXISTS idx_details_ventes_vente  ON public.details_ventes(vente_id);
CREATE INDEX IF NOT EXISTS idx_details_ventes_piece  ON public.details_ventes(piece_id);

CREATE INDEX IF NOT EXISTS idx_achats_boutique_id    ON public.achats(boutique_id);
CREATE INDEX IF NOT EXISTS idx_achats_created_at     ON public.achats(created_at);
CREATE INDEX IF NOT EXISTS idx_details_achats_achat  ON public.details_achats(achat_id);

CREATE INDEX IF NOT EXISTS idx_stock_boutique        ON public.stock(boutique_id);
CREATE INDEX IF NOT EXISTS idx_stock_piece           ON public.stock(piece_id);

CREATE INDEX IF NOT EXISTS idx_depenses_boutique     ON public.depenses(boutique_id);
CREATE INDEX IF NOT EXISTS idx_depenses_created_at   ON public.depenses(created_at);

CREATE INDEX IF NOT EXISTS idx_caisse_boutique       ON public.caisse(boutique_id);
CREATE INDEX IF NOT EXISTS idx_profiles_boutique     ON public.profiles(boutique_id);


-- ==============================================================================
-- ÉTAPE 5 : ACCÈS PUBLIC (nécessaire pour que Supabase Auth fonctionne)
-- ==============================================================================

-- Tout utilisateur authentifié peut lire les rôles
GRANT SELECT ON public.roles TO authenticated;

-- Tout utilisateur authentifié peut lire son propre profil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profil visible par son propriétaire ou l'admin" ON public.profiles;
CREATE POLICY "Profil visible par son propriétaire ou l'admin" ON public.profiles
  FOR ALL USING (id = auth.uid() OR auth.user_role() = 'administrateur');

-- Les boutiques, pièces et stock sont lisibles par tous les utilisateurs connectés
GRANT SELECT ON public.boutiques TO authenticated;
GRANT SELECT ON public.pieces TO authenticated;
GRANT SELECT ON public.stock TO authenticated;
GRANT SELECT ON public.fournisseurs TO authenticated;
GRANT SELECT ON public.piece_fournisseurs TO authenticated;
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO authenticated;


-- ==============================================================================
-- ✅ TERMINÉ ! Base de données prête.
--
-- PROCHAINE ÉTAPE : Exécutez supabase_rls_lock.sql pour sécuriser les données
-- financières (ventes, caisse, dépenses) par boutique.
--
-- TABLES CRÉÉES :
--   ✅ roles               - Rôles utilisateurs
--   ✅ boutiques           - Points de vente
--   ✅ profiles            - Comptes utilisateurs
--   ✅ app_settings        - Matrice des autorisations (Cloud Sync)
--   ✅ pieces              - Catalogue des pièces automobiles
--   ✅ fournisseurs        - Fournisseurs
--   ✅ piece_fournisseurs  - Liaison pièces ↔ fournisseurs
--   ✅ stock               - Inventaire par boutique
--   ✅ ventes              - En-têtes de ventes
--   ✅ details_ventes      - Lignes de ventes
--   ✅ achats              - En-têtes d'achats
--   ✅ details_achats      - Lignes d'achats
--   ✅ caisse              - Mouvements de caisse
--   ✅ depenses            - Dépenses opérationnelles
-- ==============================================================================
