# Boîte à Idées - AINA PIÈCE AUTO

Ce fichier rassemble toutes les idées d'amélioration et d'évolution pour le futur de l'application.

## 1. Ergonomie et Interface (UI/UX)
- Mettre en place un système de notifications "Push" (cloche en haut à droite) pour alerter immédiatement lors d'une rupture de stock.
- Ajouter un mode "Plein écran" (Kiosk Mode) exclusif pour les caissiers pour éviter qu'ils ne cliquent ailleurs.

## 2. Fonctionnalités Avancées
- **Scan de Code-barres :** Intégrer la prise en charge d'une douchette de code-barres. Quand on est sur la page Ventes, scanner le code sélectionne automatiquement la pièce.
- **Historique de prix :** Tracer l'évolution du prix d'achat d'une pièce pour visualiser si les fournisseurs augmentent leurs tarifs au fil des mois.
- **Gestion des retours clients :** Ajouter un module pour annuler ou rembourser une vente et réintégrer automatiquement la pièce en stock.

## 3. Sécurité et Backup (Nouvelles Idées)
- **Synchronisation Google Drive API :** Remplacer le téléchargement du point de sauvegarde `.txt` par un upload direct et invisible vers un dossier Google Drive privé (pour contourner définitivement les blocages d'emails).
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
- **Bouton de Remise à Zéro Totale :** Créer un bouton (sécurisé par mot de passe admin) dans les Paramètres permettant de vider entièrement la base de données (Boutiques, Ventes, Achats, Utilisateurs sauf Admin) pour pouvoir démarrer une nouvelle année ou redémarrer proprement un client SaaS sans lancer de scripts manuels.
- **Validation stricte de la création d'utilisateur :** Obliger l'administrateur à sélectionner une boutique existante avant de valider la création d'un utilisateur pour éviter le croisement de permissions.
