-- ============================================================
-- 🔧 CORRECTION SCHEMA STOCK — AINA PIÈCE AUTO
-- À exécuter dans Supabase > SQL Editor > New Query
-- ============================================================
-- Ce script ajoute les colonnes manquantes à la table stock
-- si elles n'existent pas déjà. Il est 100% SAFE à réexécuter.
-- ============================================================

-- Ajouter la colonne emplacement si elle n'existe pas
ALTER TABLE public.stock 
  ADD COLUMN IF NOT EXISTS emplacement text;

-- Ajouter stock_minimum si elle n'existe pas (alias de seuil_alerte)
ALTER TABLE public.stock 
  ADD COLUMN IF NOT EXISTS stock_minimum integer DEFAULT 5;

-- S'assurer que la colonne created_at existe
ALTER TABLE public.stock
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Vérification finale : afficher la structure de la table stock
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'stock'
ORDER BY ordinal_position;
