-- ==============================================================================
-- TABLE : AGENDA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.agenda (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  boutique_id uuid REFERENCES public.boutiques(id) ON DELETE SET NULL,
  titre       text NOT NULL,
  description text,
  date_prevue date NOT NULL,
  type        text CHECK (type IN ('TACHE', 'ENTREE_PREVUE', 'DEPENSE_PREVUE')),
  montant     numeric(12, 2) DEFAULT 0,
  statut      text CHECK (statut IN ('A_FAIRE', 'TERMINE', 'ANNULE')) DEFAULT 'A_FAIRE',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  cree_par    uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agenda_boutique_id ON public.agenda(boutique_id);
CREATE INDEX IF NOT EXISTS idx_agenda_date_prevue ON public.agenda(date_prevue);

ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "L'agenda est visible par tous les utilisateurs de la boutique" ON public.agenda;
CREATE POLICY "L'agenda est visible par tous les utilisateurs de la boutique" ON public.agenda
  FOR SELECT USING (
    boutique_id IN (
      SELECT boutique_id FROM public.profiles WHERE id = auth.uid()
    ) OR auth.user_role() = 'administrateur'
  );

DROP POLICY IF EXISTS "Les admins et utilisateurs peuvent ajouter a l'agenda" ON public.agenda;
CREATE POLICY "Les admins et utilisateurs peuvent ajouter a l'agenda" ON public.agenda
  FOR INSERT WITH CHECK (
    boutique_id IN (
      SELECT boutique_id FROM public.profiles WHERE id = auth.uid()
    ) OR auth.user_role() = 'administrateur'
  );

DROP POLICY IF EXISTS "Les admins et utilisateurs peuvent modifier l'agenda" ON public.agenda;
CREATE POLICY "Les admins et utilisateurs peuvent modifier l'agenda" ON public.agenda
  FOR UPDATE USING (
    boutique_id IN (
      SELECT boutique_id FROM public.profiles WHERE id = auth.uid()
    ) OR auth.user_role() = 'administrateur'
  );

DROP POLICY IF EXISTS "Les admins peuvent supprimer de l'agenda" ON public.agenda;
CREATE POLICY "Les admins peuvent supprimer de l'agenda" ON public.agenda
  FOR DELETE USING (
    auth.user_role() = 'administrateur' OR 
    cree_par = auth.uid()
  );

-- GRANT permissions
GRANT ALL ON public.agenda TO authenticated;
GRANT ALL ON public.agenda TO service_role;
