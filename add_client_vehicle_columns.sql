-- Migration: Ajout des colonnes client_nom, client_immatriculation, client_marque_voiture
-- dans la table ventes pour tracker les infos du client à chaque vente.
-- Date: 2026-05-30

ALTER TABLE ventes
  ADD COLUMN IF NOT EXISTS client_nom TEXT,
  ADD COLUMN IF NOT EXISTS client_immatriculation TEXT,
  ADD COLUMN IF NOT EXISTS client_marque_voiture TEXT;

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN ventes.client_nom IS 'Nom du client acheteur (optionnel)';
COMMENT ON COLUMN ventes.client_immatriculation IS 'Immatriculation de la voiture du client (optionnel)';
COMMENT ON COLUMN ventes.client_marque_voiture IS 'Marque de la voiture du client (optionnel)';
