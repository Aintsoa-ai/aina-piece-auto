-- Ajoutez ces deux colonnes à la table pieces si elles n'existent pas
ALTER TABLE public.pieces 
ADD COLUMN IF NOT EXISTS prix_achat numeric(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS prix_vente numeric(12, 2) DEFAULT 0;

-- Forcer le rafraîchissement du cache de Supabase (PostgREST)
NOTIFY pgrst, reload_schema;
