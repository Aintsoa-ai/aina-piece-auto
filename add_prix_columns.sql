-- Ajout des colonnes prix_achat et prix_vente à la table pieces
-- Ces colonnes permettront de centraliser les prix, quel que soit le nombre de boutiques
ALTER TABLE pieces 
ADD COLUMN IF NOT EXISTS prix_achat NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS prix_vente NUMERIC DEFAULT 0;
