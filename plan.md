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

## Phase 6 : Optimisation de l'Expérience Utilisateur (Terminée)
- [x] Harmonisation de toutes les boîtes de dialogue (suppression des popups natifs bloquants).
- [x] Standardisation du design des calendriers avec thématique sombre et indicateurs d'activité (pastilles rouges).
- [x] Revue complète de l'ergonomie sur mobile pour garantir que les claviers virtuels ne masquent plus aucune zone de saisie.

## Phase 7 : Véritable Système Hors-Ligne (PWA & IndexedDB) (Terminée)
- [x] Créer une base de données locale (IndexedDB) pour stocker temporairement les ventes sans réseau.
- [x] Mettre en cache le catalogue complet et les stocks pour la recherche hors-ligne dans la Caisse.
- [x] Développer le système de synchronisation automatique (File d'attente) au retour de la connexion Internet.
- [x] Gérer les conflits de stock lors de la synchronisation (vérification backend).

## Phase 8 : Fonctionnalités Intelligentes (Terminée)
- [x] Comparateur dynamique de fournisseurs : Calcul instantané du meilleur prix d'achat basé sur l'historique réel de la base de données au lieu de données simulées.
- [x] Historique d'évolution des prix : Calcul des pourcentages de hausse/baisse (+15%) directement sur le comparateur.
- [x] Résolution de la défaillance de rafraîchissement d'état (stale closure) sur l'indicateur de connexion des boutiques.

## Phase 9 : Maintenance, Monitoring et Personnalisation (Terminée)
- [x] Intégration du module "Factory Reset" pour permettre la purge sélective des données (catalogue, ventes, historiques).
- [x] Monitoring de la capacité de stockage Supabase en temps réel sur le Dashboard.
- [x] Rendre la barre latérale dynamique selon la boutique (nom et icône).
- [x] Sauvegarde Cloud Supabase (Drive Native) : Envoi direct des backups `.txt` dans un Storage Bucket pour remplacer les emails instables.
- [x] Mode Hors-Ligne Total : Ajout du support IndexedDB pour les Achats et les Dépenses.

## Phase 10 : Intégration Code-barres (Hardware Douchette) - (Terminée)
- [x] Ajouter la colonne `code_barre` à la table `pieces` dans Supabase.
- [x] Mettre à jour l'interface de création/modification des pièces pour inclure le champ `code_barre`.
- [x] Intégrer l'écouteur/champ de saisie dans le module "Ventes / Caisse" pour ajout rapide au panier.
- [x] Intégrer la sélection rapide par scan dans le module "Achats / Réception".

## Phase 11 : Fonctionnalités Métiers (Retours, Étiquettes, Crédits) - (Terminée)
- [x] Déploiement d'un générateur d'étiquettes thermiques pour les codes-barres avec bwip-js.
- [x] Implémentation du remboursement client et restauration de stock dans l'historique des ventes.
- [x] Création d'un module "Clients & Crédits" pour le suivi des factures impayées des garages partenaires.
- [x] Compatibilité Hors-Ligne des Ventes à Crédit (Synchronisation des statuts de paiement avec IndexedDB).
- [x] Implémenter le traducteur AZERTY pour les codes-barres en Caisse et Catalogue.
- [x] Assurer que les clics dans le vide ne sont plus obligatoires (tolérance 500ms).
- [x] Ajouter l'option GLOBAL pour créer des pièces partout à la fois.
- [x] Mettre en place un vrai calcul d'encaissement (Espèces vs Total = Reste à rendre).
- [x] Corriger le blocage du scanner (Intrus du focus).
- [x] Mettre en place la limitation des heures de travail.
- [x] Déployer l'écran de verrouillage avec dérogation admin.
- [x] Créer l'avertisseur "Fermeture dans 15 min".

## Phase 12 : Optimisation, Robustesse et Prévention des Erreurs (Terminée)
- [x] Sécurisation du "Hard Reset" (base de données) pour prendre en charge correctement les identifiants UUID et éviter tout blocage.
- [x] Création d'un système de "Blindage" dans le contexte d'authentification pour garantir que l'administrateur principal (ainapieces2026@gmail.com) ne perde jamais ses privilèges, même en cas de mauvaise connexion (timeout).
- [x] Optimisation de l'ergonomie de création des utilisateurs : réinitialisation automatique du sélecteur de boutique pour prévenir l'assignation de plusieurs caissiers à une même boutique par erreur.
- [x] Restauration des paramètres de matrice d'autorisations pour inclure la gestion granulaire au niveau des boutiques physiques.

## Phase 13 : Livraison finale au Client (Actuelle — 30/05/2026)
- [x] Correction du bug critique UUID caissier (source de tous les problèmes de boutique).
- [x] Ticket thermique dynamique selon la boutique de la vente avec en-tête figée.
- [x] Hard Reset 100% complet (caisse + clients inclus).
- [x] Nettoyage du dépôt (suppression des scripts temporaires).
- [x] Correction quantitée doublée en mode GLOBAL (division équitable entre boutiques).
- [x] Correction multiplicateur prix (1.5 dans Sales.tsx).
- [x] Sauvegarde de prix_vente et prix_achat directement dans la table pieces.
- [x] Cohérence Catalogue -> Ventes (prix de vente identiques).
- [x] Séparation des ventes au comptant et à crédit dans le flux principal.
- [x] Stabilisation de la sélection de la boutique dans le dropdown après validation.
- [x] Ajustement du délai douchette (100ms) pour éviter la fragmentation des codes-barres.
- [x] Intégration d'un heartbeat automatique toutes les 5 minutes pour maintenir le témoin vert "En ligne" des caissiers.
- [x] Correction du filtre de date locale (fuseau horaire Madagascar UTC+3) sur le Dashboard.
- [x] Documentation complète : README.md, auDit.md, plan.md, nos_idees.md, GUIDE.md.
- [ ] Remise finale des clés au propriétaire.
- [ ] Première réinitialisation officielle + création des boutiques et caissiers en production.
