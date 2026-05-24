-- ==============================================================================
-- 🚀 SCRIPT D'ACTIVATION DE LA SÉCURITÉ INVISIBLE (RLS - ROW LEVEL SECURITY)
-- ==============================================================================
-- Ce script va verrouiller la base de données Supabase pour empêcher un employé 
-- d'une boutique (ex: Boutique Nord) de lire ou modifier les ventes, la caisse 
-- ou les dépenses d'une autre boutique (ex: Boutique Centre).
-- L'administrateur garde toujours tous les droits universels.
--
-- INSTRUCTIONS :
-- 1. Allez sur votre tableau de bord Supabase : https://supabase.com/dashboard
-- 2. Allez dans "SQL Editor" (Menu de gauche, icône </>)
-- 3. Cliquez sur "New query"
-- 4. Copiez-collez l'intégralité de ce fichier et cliquez sur "RUN" en bas à droite.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- ÉTAPE 1 : Fonctions utilitaires rapides
-- Ces fonctions permettent à Supabase de savoir instantanément le rôle et
-- la boutique de la personne connectée pour appliquer les filtres.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS text AS $$
  SELECT r.name 
  FROM public.profiles p
  LEFT JOIN public.roles r ON p.role_id = r.id
  WHERE p.id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.user_boutique_id() RETURNS uuid AS $$
  SELECT boutique_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- ÉTAPE 2 : Activer le RLS sur les tables cibles
-- ------------------------------------------------------------------------------
ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.details_ventes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- ÉTAPE 3 : Créer les Politiques (Règles de sécurité)
-- ------------------------------------------------------------------------------

-- 🛒 TABLE : VENTES
-- L'admin voit tout. La boutique voit uniquement ses propres ventes.
DROP POLICY IF EXISTS "Ventes visibles par l'admin ou la boutique propriétaire" ON public.ventes;
CREATE POLICY "Ventes visibles par l'admin ou la boutique propriétaire" ON public.ventes
  FOR SELECT USING (
    auth.user_role() = 'administrateur' OR boutique_id = auth.user_boutique_id()
  );

DROP POLICY IF EXISTS "Ventes modifiables par l'admin ou la boutique propriétaire" ON public.ventes;
CREATE POLICY "Ventes modifiables par l'admin ou la boutique propriétaire" ON public.ventes
  FOR ALL USING (
    auth.user_role() = 'administrateur' OR boutique_id = auth.user_boutique_id()
  );

-- 🛒 TABLE : DETAILS_VENTES
-- Les détails de ventes sont sécurisés en vérifiant à quelle "vente" ils appartiennent.
DROP POLICY IF EXISTS "Détails visibles via la vente associée" ON public.details_ventes;
CREATE POLICY "Détails visibles via la vente associée" ON public.details_ventes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ventes v 
      WHERE v.id = vente_id AND (auth.user_role() = 'administrateur' OR v.boutique_id = auth.user_boutique_id())
    )
  );

DROP POLICY IF EXISTS "Détails modifiables via la vente associée" ON public.details_ventes;
CREATE POLICY "Détails modifiables via la vente associée" ON public.details_ventes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ventes v 
      WHERE v.id = vente_id AND (auth.user_role() = 'administrateur' OR v.boutique_id = auth.user_boutique_id())
    )
  );

-- 💵 TABLE : CAISSE
-- Chacun ne voit que sa caisse.
DROP POLICY IF EXISTS "Caisse visible par l'admin ou la boutique propriétaire" ON public.caisse;
CREATE POLICY "Caisse visible par l'admin ou la boutique propriétaire" ON public.caisse
  FOR SELECT USING (
    auth.user_role() = 'administrateur' OR boutique_id = auth.user_boutique_id()
  );

DROP POLICY IF EXISTS "Caisse modifiable par l'admin ou la boutique propriétaire" ON public.caisse;
CREATE POLICY "Caisse modifiable par l'admin ou la boutique propriétaire" ON public.caisse
  FOR ALL USING (
    auth.user_role() = 'administrateur' OR boutique_id = auth.user_boutique_id()
  );

-- 💸 TABLE : DEPENSES
-- Chacun ne voit que ses dépenses.
DROP POLICY IF EXISTS "Depenses visibles par admin ou boutique propriétaire" ON public.depenses;
CREATE POLICY "Depenses visibles par admin ou boutique propriétaire" ON public.depenses
  FOR SELECT USING (
    auth.user_role() = 'administrateur' OR boutique_id = auth.user_boutique_id()
  );

DROP POLICY IF EXISTS "Depenses modifiables par admin ou boutique propriétaire" ON public.depenses;
CREATE POLICY "Depenses modifiables par admin ou boutique propriétaire" ON public.depenses
  FOR ALL USING (
    auth.user_role() = 'administrateur' OR boutique_id = auth.user_boutique_id()
  );

-- ==============================================================================
-- ✅ TERMINÉ !
-- Note : Le "Stock" et le "Catalogue de Pièces" ne sont PAS restreints par RLS.
-- Cela est volontaire : ça permet à un caissier de chercher une pièce sur 
-- son logiciel et de voir si une autre boutique l'a en stock pour rediriger 
-- le client ! L'accès visuel au menu "Stock" est déjà géré par la matrice cloud.
-- ==============================================================================
