-- Script SQL pour ajouter le système de Crédit / Garages
-- À exécuter dans l'éditeur SQL de Supabase (SQL Editor)

-- 1. Création de la table clients (pour les garages et clients réguliers)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    contact TEXT,
    type_client TEXT DEFAULT 'GARAGE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ajout des colonnes liées au crédit dans la table ventes
ALTER TABLE public.ventes 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS statut_paiement TEXT DEFAULT 'PAYE',
ADD COLUMN IF NOT EXISTS montant_paye NUMERIC DEFAULT 0;

-- 3. Table pour tracer les règlements (quand le garage paie ses dettes)
CREATE TABLE IF NOT EXISTS public.reglements_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) NOT NULL,
    montant NUMERIC NOT NULL,
    date_reglement TIMESTAMPTZ DEFAULT NOW(),
    caissier_id UUID REFERENCES auth.users(id),
    commentaire TEXT
);

-- 4. Sécurité (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reglements_credits ENABLE ROW LEVEL SECURITY;

-- Autoriser tout le monde authentifié à lire et écrire les clients et règlements
CREATE POLICY "Clients accès total pour authentifiés" ON public.clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Règlements accès total pour authentifiés" ON public.reglements_credits FOR ALL USING (auth.role() = 'authenticated');
