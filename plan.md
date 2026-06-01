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

## Phase 15 : Améliorations Futures (À Planifier)
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
