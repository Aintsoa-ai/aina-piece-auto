# Plan d'Action et Déploiement - AINA PIÈCE AUTO

## Phase 1-13 : Terminées
Voir les commits Git et `auDit.md` pour le détail complet des phases 1 à 13.

## Phase 14 : Améliorations Post-Livraison (31/05/2026 - 01/06/2026) ✅
- [x] **Uniformisation exports** : PDF = Word = Excel (mêmes KPIs, top produits, alertes stock).
- [x] **Impression thermique automatique** : Option Paramètres → Système, fallback PDF si pas d'imprimante.
- [x] **Règlements crédit dans tableau de vente** : Statut `REGLEMENT_CREDIT`, libellé "Règlement Crédit - [Nom]".
- [x] **Code couleur crédits en attente** : Fond rouge si dette ouverte, normal une fois soldée.
- [x] **Calcul dynamique modal Encaisser** : Reste à payer + Reste à rendre en temps réel.
- [x] **Paiement borné à la dette** : `Math.min(montant_saisi, dette_totale)`.
- [x] **UI Pièces** : Colonne "Lieu" et filtre "Professionnel" (Boutique).
- [x] **UI Ventes** : Prix de vente modifiable directement dans le panier.
- [x] Documentation mise à jour (README, auDit, plan, nos_idees, GUIDE).

## Phase 15 : Standardisation EAN-13 et Étiquettes 5cmx3cm (03/06/2026) ✅
- [x] **Générateur Déterministe EAN-13** : Algorithme convertissant toute référence en EAN-13 valide.
- [x] **Compatibilité Scanner Multimodule** : Reconnaissance et résolution automatique des codes EAN-13 scannés (Ventes, Achats, Stock, Pièces).
- [x] **Format d'Impression Thermique 5cm × 3cm** : Dimensions exactes de l'image de code-barres.
- [x] **Masquage du prix** sur les étiquettes de pièces.
- [x] **Chiffres EAN-13 de garde** parfaitement centrés et lisibles.

## Phase 16 : Fiabilisation Catalogue et Interface (13/06/2026) ✅
- [x] **Date d'Arrivage** : Remplacement de l'affichage de la catégorie par la date d'arrivage dans la table Pièces.
- [x] **Recherche Pièces** : Résolution du filtrage insensible à la casse et de la compatibilité avec codes-barres.
- [x] **Mise à Jour Quantité** : Cible automatique de la boutique sélectionnée (correction de l'écrasement global).
- [x] **Résolution Base Vierge** : Correction du problème "lieu vide" (b1) et "quantité à 0" à l'ajout initial.
- [x] **Pagination Supabase (fetchAll)** : Contournement de la limite par défaut de 1000 lignes pour garantir un catalogue et un stock complets.
- [x] **Alignement Schéma de Base** : Retour à `stock_minimum` au lieu de `seuil_alerte` pour éviter les blocages silencieux.

## Phase 17 : Application Mobile "Agenda Intelligent" (13/06/2026 - 14/06/2026) ✅
- [x] Création d'une application React Native (APK) totalement hors-ligne.
- [x] Moteur vocal bilingue Français/Malgache avec prononciation humanisée et ciblage natif des voix premium.
- [x] Système de Thème Auto-Adaptatif "Jour/Nuit" basé sur l'heure locale et salutations contextuelles.
- [x] Base de données locale (AsyncStorage) pour les finances et l'agenda.
- [x] Calcul astronomique embarqué pour les jours fériés malgaches mobiles.
- [x] Personnalisation de l'IA (Bi-genrée, Noms indépendants) et paramètres de routines.
- [x] UX Magique : Sous-titres dynamiques, lecture sur clic date, et bouton Mute intelligent.
- [x] Modification des tâches à la volée sans suppression et reprogrammation des alarmes en temps réel.

## Phase 18 : Améliorations Futures (À Planifier)
- [ ] Toggle impression auto réactif sans rechargement page Ventes (useEffect storage listener).
- [ ] Contrainte UNIQUE sur `code_barre` en base de données.
- [ ] Limite temporelle Dashboard (30 derniers jours par défaut).
- [ ] Notification Push ventes en temps réel (Web Push API).
- [ ] Module Devis / Facture Pro pour les garages.
- [ ] Paiement partiel sur crédit au moment de la vente (acompte).
- [ ] Page de démonstration publique + grille tarifaire SaaS.
- [ ] Session de formation en conditions réelles avec le personnel Aina Pièce Auto.
- [ ] Remise finale des clés au propriétaire.

## Phases 1 à 13 (Résumé)
- Phase 1 : Stabilisation & Supabase
- Phase 2 : Permissions & Rôles  
- Phase 3 : Multi-Boutique
- Phase 4 : Production Vercel
- Phase 5 : Template SaaS (partiel)
- Phase 6 : UX/UI Optimisation
- Phase 7 : PWA Hors-Ligne
- Phase 8 : Fonctionnalités Intelligentes
- Phase 9 : Monitoring & Personnalisation
- Phase 10 : Code-barres Douchette
- Phase 11 : Retours, Étiquettes, Crédits
- Phase 12 : Robustesse & Prévention erreurs
- Phase 13 : Livraison finale (30/05/2026)
