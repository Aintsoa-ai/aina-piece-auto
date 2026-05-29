# Boîte à Idées - AINA PIÈCE AUTO

Ce fichier rassemble toutes les idées d'amélioration et d'évolution pour le futur de l'application.

## 1. Ergonomie et Interface (UI/UX)
- Mettre en place un système de notifications "Push" (cloche en haut à droite) pour alerter immédiatement lors d'une rupture de stock.
- Ajouter un mode "Plein écran" (Kiosk Mode) exclusif pour les caissiers pour éviter qu'ils ne cliquent ailleurs.

## 2. Fonctionnalités Avancées
- **Scan de Code-barres (Terminé) :** Prise en charge d'une douchette de code-barres USB. Un écouteur global détecte intelligemment le scan rapide pour l'ajout au panier (Ventes), la sélection (Achats) et l'enregistrement (Catalogue).
- **Historique de prix (Terminé) :** Tracer l'évolution du prix d'achat d'une pièce pour visualiser si les fournisseurs augmentent leurs tarifs au fil des mois (Affichage du pourcentage de hausse/baisse).
- **Gestion des retours clients (Terminé) :** Ajouter un module pour annuler ou rembourser une vente et réintégrer automatiquement la pièce en stock.

## 3. Sécurité et Backup (Nouvelles Idées)
- **Sauvegarde Cloud Native (Terminé) :** Remplacement de l'email par un upload silencieux et direct vers le Bucket Supabase "backups" (Cloud Drive 1Go intégré).
- **Alerte SMS de vol/intrusion :** Envoyer un SMS d'alerte à l'administrateur si une tentative de connexion ou de purge échoue plusieurs fois.

## 4. Communication et Multi-boutique
- Chat interne entre les boutiques (ex: la boutique Centre peut demander via l'application si la boutique Nord possède une pièce).
- Transfert de stock d'une boutique à l'autre avec validation formelle (Boutique A envoie -> Boutique B réceptionne avec signature numérique).

## 5. Analyse et Comptabilité
- Connecter le module de dépenses à un compte bancaire (API si disponible à Madagascar) pour un rapprochement automatique.
- Interface dédiée "Expert Comptable" : un accès réduit permettant uniquement de consulter le bilan de fin de mois et de le télécharger en PDF certifié.

## 6. Automatisation des Flux
- **Auto-approvisionnement des nouvelles boutiques :** Créer un trigger Supabase ou une fonction backend qui, lors de la création d'une nouvelle boutique, génère automatiquement un stock de quantité "0" pour toutes les pièces existantes dans le catalogue global, évitant ainsi un catalogue vide pour la nouvelle entité.

## 7. Personnalisation des Rapports
- **Thèmes de Rapports Dynamiques :** Permettre à l'administrateur de modifier les couleurs principales du rapport PDF (remplacer le Vert Sarcelle par un Rouge ou Bleu d'entreprise) directement via un sélecteur de couleurs dans les Paramètres, pour s'adapter à une future charte graphique.
- **Aperçu PDF en temps réel :** Ajouter un bouton "Prévisualiser" qui affiche le rapport dans un panneau latéral (iframe) dans l'application elle-même avant de déclencher le téléchargement — évite de générer un mauvais fichier sans s'en rendre compte.

## 8. Gestion et Nettoyage Avancé
- **Validation stricte de la création d'utilisateur :** Obliger l'administrateur à sélectionner une boutique existante avant de valider la création d'un utilisateur pour éviter le croisement de permissions.
- **Détection des Conflits de Stock (Offline) :** Créer un mécanisme serveur qui détecte les ruptures de stock après coup (si deux boutiques vendent la même dernière pièce hors-ligne) et envoie une notification "Alerte de conflit de stock" à l'administrateur.

### Améliorations Futures (Interface & UX)
- **Calendriers Avancés :** Sélection des plages de dates avec animation de glissement.
- **Thématisation :** Permettre aux utilisateurs de choisir la couleur d'accentuation (au lieu de seulement bleu/rouge).

## 9. Fonctionnement Hors-Ligne (PWA & Offline First)
- **Diff-Sync pour le Catalogue :** Actuellement, le `syncDown` supprime et remet l'intégralité du catalogue. À l'avenir, implémenter un "Delta Sync" (ou Diff-Sync) qui ne télécharge que les lignes ajoutées/modifiées depuis le dernier horodatage afin d'économiser de la bande passante sur mobile.
- **Support des Achats & Dépenses (Terminé) :** L'infrastructure Offline (IndexedDB) gère désormais les Achats et les Dépenses (files d'attente hors-ligne complètes synchronisées au retour réseau).


### Améliorations Futures (Synchronisation)
- **File d'attente avancée :** Afficher un historique visuel détaillé (liste) des ventes synchronisées avec leurs statuts (succès, échec) directement dans un panneau latéral en cliquant sur le nuage.
- **Notification push :** Envoyer une alerte sonore ou une notification native à l'administrateur lorsqu'une boutique se déconnecte du réseau pendant les heures d'ouverture.

### Améliorations Futures (Achats & IA)
- **Graphique d'évolution des prix :** Afficher une petite courbe (sparkline) montrant l'inflation ou la baisse du prix d'une pièce chez un fournisseur sélectionné au fil des mois.
- **Alerte de marge :** Bloquer ou alerter le vendeur si le prix de vente saisi est inférieur au prix d'achat moyen calculé dynamiquement.

## 10. Tests et Validation Matérielle (Nouveau)
- **Outil de Diagnostic Scanner :** Créer une petite interface cachée dans les paramètres ou une page secrète pour tester la vitesse de frappe et le suffixe (Enter) du lecteur de codes-barres matériel récemment reçu.
- **Responsive Hybride pour Calendriers :** Si le nouveau `react-datepicker` s'avère peu pratique sur petit écran tactile, implémenter une bascule automatique : utiliser `react-datepicker` sur Ordinateur et `<input type="date">` natif sur Téléphone pour récupérer les "roulettes" de sélection rapide iOS/Android.
### Id�es suite aux correctifs d'encaissement (27/05/2026 13:02)
- Ajouter plus tard un support pour le paiement Mobile Money (Mvola, Orange Money) directement dans la fen�tre d'encaissement, avec un champ "Num�ro de transaction" au lieu de "Reste � rendre".
- Cr�er un r�sum� visuel de fin de journ�e de l'esp�ce exacte qui devrait se trouver dans le tiroir caisse, bas� sur les montants encaiss�s.


### Idées suite au verrouillage horaire (27/05/2026)
- Permettre à l'administrateur de définir des horaires différents par jour de la semaine (ex: Samedi 08:00 - 12:00).
- Ajouter un message personnalisé sur l'écran de verrouillage que l'admin peut modifier (ex: "Fermeture pour inventaire annuel").


### Ides d'Amelioration Future (Interface & UI)
- **Thme Dynamique Avanc :** Permettre de modifier non seulement la couleur, mais la disposition complte du dashboard (Vue Liste vs Vue Grille).
- **Tutorial Intgr :** Ajouter un mode onboarding (des bulles d'aide) pour les nouveaux administrateurs qui dcouvrent la page de paramtres dsormais plus structure.
- **Drag & Drop pour la grille :** Donner  l'administrateur le pouvoir de rarranger l'ordre des cartes (Personnalisation, Horaires, etc.) via un glisser-dposer, et sauvegarder cet ordre.


## 5. Qualité et Maintenance Code
- **Tests automatisés E2E :** Mettre en place des tests d'interface utilisateur (ex: Cypress ou Playwright) pour prévenir la régression des affichages d'onglets et de l'ergonomie mobile après chaque mise à jour.
- **Nettoyage automatique des scripts :** Supprimer les scripts de correction temporaires (comme reapply.cjs) une fois que les modifications ont été validées en production.

- **Sécurité et DB** : En cas de futurs besoins d'effacement de comptes liés à Supabase Auth, toujours privilégier l'usage d'Edge Functions ou de scripts RPC SQL (SECURITY DEFINER) plutôt que des API Frontend pour éviter les failles de sécurité.

## 6. Améliorations de l'Ergonomie et de la Prévention (29/05/2026)
- **Validation intelligente des formulaires :** Pour les futures fonctionnalités, toujours s'assurer que les listes déroulantes (comme le choix de la boutique lors de la création d'un utilisateur) se réinitialisent ou demandent une confirmation pour éviter les doublons ou erreurs d'assignation.
- **Blindage ("Hardcoding") des accès super-admin :** L'approche utilisée pour ainapieces2026@gmail.com (garantie des droits administrateur absolue via l'email) devrait être documentée comme "best practice" pour tout futur ERP nécessitant un compte maître indestructible.
- **Amélioration du fallback réseau :** Affiner encore plus les délais de "timeout" (passés de 3s à 5s) selon la qualité du réseau détectée sur l'appareil (Mobile vs Desktop) pour ne déclencher les modes hors-ligne qu'en cas de réelle nécessité.


## 7. Leçons de la Session de Livraison (29/05/2026)
- **Toujours tester la création de compte avec un UUID dynamique :** Ne jamais mettre de valeurs "en dur" comme des noms de rôles textuels dans des champs UUID. Utiliser une requête SELECT pour récupérer l'ID réel.
- **Le Hard Reset doit tout vider :** Penser à inclure TOUTES les tables liées lors de l'extension du système (caisse, clients, tickets, permissions...).
- **Bouton "fantôme" après sync hors-ligne :** Quand une vente hors-ligne échoue à se synchroniser (car le profil avait un mauvais boutique_id), le badge orange du bouton Cloud reste affiché. La solution = corriger le profil ET demander une déconnexion/reconnexion sur le téléphone concerné.
- **Formation obligatoire avant livraison :** Insister auprès du propriétaire sur l'importance de TOUJOURS sélectionner la boutique lors de la création d'un caissier, même si la liste semble pré-remplie.
- **Idée future :** Ajouter une confirmation visuelle (un bandeau vert avec le nom de la boutique sélectionnée) dans le formulaire de création de caissier, pour rendre la sélection encore plus explicite.
- **Idée future :** Créer un script automatique de vérification de cohérence (cron ou Edge Function Supabase) qui détecte les profils sans boutique_id valide et envoie une alerte à l'administrateur.


## 7. Leçons de la Session de Livraison (29/05/2026)
- **Toujours tester la création de compte avec un UUID dynamique :** Ne jamais mettre de valeurs "en dur" comme des noms de rôles textuels dans des champs UUID. Utiliser une requête SELECT pour récupérer l'ID réel.
- **Le Hard Reset doit tout vider :** Penser à inclure TOUTES les tables liées lors de l'extension du système (caisse, clients, tickets, permissions...).
- **Bouton "fantôme" après sync hors-ligne :** Quand une vente hors-ligne échoue à se synchroniser (car le profil avait un mauvais boutique_id), le badge orange du bouton Cloud reste affiché. La solution = corriger le profil ET demander une déconnexion/reconnexion sur le téléphone concerné.
- **Formation obligatoire avant livraison :** Insister auprès du propriétaire sur l'importance de TOUJOURS sélectionner la boutique lors de la création d'un caissier, même si la liste semble pré-remplie.
- **Idée future :** Ajouter une confirmation visuelle (un bandeau vert avec le nom de la boutique sélectionnée) dans le formulaire de création de caissier, pour rendre la sélection encore plus explicite.
- **Idée future :** Créer un script automatique de vérification de cohérence (cron ou Edge Function Supabase) qui détecte les profils sans boutique_id valide et envoie une alerte à l'administrateur.


## 8. Idées issues des corrections Prix & Quantité (29/05/2026)
- **Idée future :** Afficher dans le formulaire d'édition GLOBAL une ligne "Détail par boutique"
  qui montre en temps réel combien chaque boutique va recevoir (ex: 20 pour BEHORIRIKA, 20 pour
  ANDRAVOAHANGY) AVANT de cliquer Enregistrer. Cela évite toute confusion.
- **Idée future :** Ajouter une page "Inventaire Global" qui montre la répartition du stock par
  boutique pour chaque pièce, avec la possibilité de transférer des unités d'une boutique à l'autre.
- **Idée future :** Ajouter une alerte visuelle si le prix de vente saisi est inférieur au prix
  d'achat (marge négative). Exemple: "⚠️ Attention : Prix de vente (8 000) < Prix d'achat (10 000)".
- **Règle de développement :** Toujours inclure `prix_vente` ET `prix_achat` dans tout payload
  d'insertion/mise à jour de la table `pieces`. Ne jamais se fier aux calculs de fallback pour des
  données financières.

### Idées d'amélioration suite aux correctifs (29/05/2026)
- Ajouter une notification automatique (ex: SMS ou Email) pour la relance des factures à crédit auprès des garages partenaires.
- Proposer une fonctionnalité pour consolider (regrouper) plusieurs factures à crédit d'un même client sur un seul ticket récapitulatif pour faciliter son paiement de fin de mois.
