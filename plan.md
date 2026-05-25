# Plan d'Action et Déploiement - AINA PIÈCE AUTO

## Phase 1 : Stabilisation et Test de Robustesse (Terminée)
- [x] Remplacement des fausses données par la base de données Supabase.
- [x] Intégration et validation du système d'importation Excel.
- [x] Optimisation de l'ergonomie des barres de recherche pour la sélection de pièces.
- [x] Implémentation du système complet de reporting (PDF, Excel, Word) avec filtres.
- [x] Déploiement du système de sauvegarde de sécurité anti-vol (Cloud & Email).

## Phase 2 : Système de Permissions et Rôles (Terminée)
- [x] Séparation des vues selon le rôle de l'utilisateur (Administrateur vs Employé).
- [x] Interface intra-app pour la création d'accès restreints (Générateur de comptes Caissiers).
- [x] Déploiement de la Matrice des Autorisations centralisée (Cloud Sync) pour un contrôle universel (Mobile/Desktop).
- [x] Correctif d'expérience utilisateur (Suppression du chargement bloquant lors du changement d'onglet ou retour sur l'app).

## Phase 3 : Finalisation Multi-Boutique (Terminée)
- [x] Lier les ventes directement à une "Boutique" spécifique (Centre ou Nord).
- [x] Faire en sorte que le Dashboard global puisse être filtré : "Statistiques Boutique Centre" vs "Statistiques Boutique Nord" (Réalisé via le module de rapport et d'export).
- [x] Implémenter un Mode Simulateur pour que l'Administrateur teste l'interface de chaque boutique en un clic.

## Phase 4 : Déploiement Production (Go-Live) - (Terminée)
- [x] Validation de l'intégrité du moteur de rendu PDF (Design exécutif, vectoriel, couleurs inline) sur tous les appareils.
- [x] Correction de la visibilité des textes et couleurs dans le PDF (remplacement des classes CSS par des styles inline pour compatibilité `html2canvas`).
- [x] Compiler le code (`npm run build`).
- [x] Héberger l'application sur un serveur de production web (Vercel).
- [x] Activer les politiques de sécurité finales (Row Level Security - RLS) sur Supabase pour garantir qu'aucune donnée ne fuite sans token d'authentification valide.
- [ ] Effectuer une session de formation en conditions réelles avec le personnel Aina Pièce Auto.

## Phase 5 : Produit Multi-Client (Template SaaS)
- [x] Génération de `schema_initial.sql` : script SQL complet pour créer une base Supabase vierge en 1 clic pour un nouveau client.
- [x] Guide de déploiement `client_deploy.md` : procédure complète (~15 min) pour livrer l'ERP à un nouveau client.
- [x] Pousser le code source sur un repository GitHub privé (une seule branche = tous les clients).
- [ ] Créer une page de démonstration publique (avec fausses données) pour les prospects.
- [ ] Définir une grille tarifaire : Forfait installation + Abonnement mensuel maintenance.


## Phase 6 : Optimisation de l'Expérience Utilisateur (En cours)
- [x] Harmonisation de toutes les boîtes de dialogue (suppression des popups natifs bloquants).
- [x] Standardisation du design des calendriers avec thématique sombre et indicateurs d'activité (pastilles rouges).
- [ ] Revue complète de l'ergonomie sur mobile pour garantir que les claviers virtuels ne masquent plus aucune zone de saisie.

## Phase 7 : Véritable Système Hors-Ligne (PWA & IndexedDB)
- [ ] Créer une base de données locale (IndexedDB) pour stocker temporairement les ventes sans réseau.
- [ ] Mettre en cache le catalogue complet et les stocks pour la recherche hors-ligne dans la Caisse.
- [ ] Développer le système de synchronisation automatique (File d'attente) au retour de la connexion Internet.
- [ ] Gérer les conflits de stock lors de la synchronisation (vérification backend).
