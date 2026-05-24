-- 1. DROP EXISTING POLICIES (handling accents and non-accents to be safe)
DROP POLICY IF EXISTS "Ventes visibles par l'admin ou la boutique propriétaire" ON public.ventes;
DROP POLICY IF EXISTS "Ventes modifiables par l'admin ou la boutique propriétaire" ON public.ventes;
DROP POLICY IF EXISTS "Ventes visibles par l'admin ou la boutique proprietaire" ON public.ventes;
DROP POLICY IF EXISTS "Ventes modifiables par l'admin ou la boutique proprietaire" ON public.ventes;

DROP POLICY IF EXISTS "Détails visibles via la vente associée" ON public.details_ventes;
DROP POLICY IF EXISTS "Détails modifiables via la vente associée" ON public.details_ventes;
DROP POLICY IF EXISTS "Details visibles via la vente associee" ON public.details_ventes;
DROP POLICY IF EXISTS "Details modifiables via la vente associee" ON public.details_ventes;

DROP POLICY IF EXISTS "Caisse visible par l'admin ou la boutique propriétaire" ON public.caisse;
DROP POLICY IF EXISTS "Caisse modifiable par l'admin ou la boutique propriétaire" ON public.caisse;
DROP POLICY IF EXISTS "Caisse visible par l'admin ou la boutique proprietaire" ON public.caisse;
DROP POLICY IF EXISTS "Caisse modifiable par l'admin ou la boutique proprietaire" ON public.caisse;

DROP POLICY IF EXISTS "Depenses visibles par admin ou boutique propriétaire" ON public.depenses;
DROP POLICY IF EXISTS "Depenses modifiables par admin ou boutique propriétaire" ON public.depenses;
DROP POLICY IF EXISTS "Depenses visibles par admin ou boutique proprietaire" ON public.depenses;
DROP POLICY IF EXISTS "Depenses modifiables par admin ou boutique proprietaire" ON public.depenses;

-- 2. CREATE FIXED FUNCTIONS
CREATE OR REPLACE FUNCTION public.user_role() RETURNS text AS $$
  SELECT r.name 
  FROM public.profiles p
  LEFT JOIN public.roles r ON p.role_id = r.id
  WHERE p.id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_boutique_id() RETURNS uuid AS $$
  SELECT boutique_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. ENABLE RLS
ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.details_ventes ENABLE ROW LEVEL SECURITY;

-- 4. CREATE NEW POLICIES
CREATE POLICY "Ventes visibles par l'admin ou la boutique propriétaire" ON public.ventes
  FOR SELECT USING (public.user_role() = 'administrateur' OR boutique_id = public.user_boutique_id());

CREATE POLICY "Ventes modifiables par l'admin ou la boutique propriétaire" ON public.ventes
  FOR ALL USING (public.user_role() = 'administrateur' OR boutique_id = public.user_boutique_id());

CREATE POLICY "Détails visibles via la vente associée" ON public.details_ventes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ventes v 
      WHERE v.id = vente_id AND (public.user_role() = 'administrateur' OR v.boutique_id = public.user_boutique_id())
    )
  );

CREATE POLICY "Détails modifiables via la vente associée" ON public.details_ventes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ventes v 
      WHERE v.id = vente_id AND (public.user_role() = 'administrateur' OR v.boutique_id = public.user_boutique_id())
    )
  );

CREATE POLICY "Caisse visible par l'admin ou la boutique propriétaire" ON public.caisse
  FOR SELECT USING (public.user_role() = 'administrateur' OR boutique_id = public.user_boutique_id());

CREATE POLICY "Caisse modifiable par l'admin ou la boutique propriétaire" ON public.caisse
  FOR ALL USING (public.user_role() = 'administrateur' OR boutique_id = public.user_boutique_id());

CREATE POLICY "Depenses visibles par admin ou boutique propriétaire" ON public.depenses
  FOR SELECT USING (public.user_role() = 'administrateur' OR boutique_id = public.user_boutique_id());

CREATE POLICY "Depenses modifiables par admin ou boutique propriétaire" ON public.depenses
  FOR ALL USING (public.user_role() = 'administrateur' OR boutique_id = public.user_boutique_id());
