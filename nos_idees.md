# Boîte à Idées - AINA PIÈCE AUTO

Ce fichier rassemble toutes les idées d'amélioration et d'évolution pour le futur de l'application.

## 1. Ergonomie et Interface (UI/UX)
- Mettre en place un système de notifications "Push" (cloche en haut à droite) pour alerter immédiatement lors d'une rupture de stock.
- Ajouter un mode "Plein écran" (Kiosk Mode) exclusif pour les caissiers pour éviter qu'ils ne cliquent ailleurs.

## 2. Fonctionnalités Avancées
- **Scan de Code-barres (Terminé) :** Prise en charge d'une douchette de code-barres USB. Un écouteur global détecte intelligemment le scan rapide pour l'ajout au panier (Ventes), la sélection (Achats) et l'enregistrement (Catalogue).
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
- **Validation stricte de la création d'utilisateur :** Obliger l'administrateur à sélectionner une boutique existante avant de valider la création d'un utilisateur pour éviter le croisement de permissions.
- **Détection des Conflits de Stock (Offline) :** Créer un mécanisme serveur qui détecte les ruptures de stock après coup (si deux boutiques vendent la même dernière pièce hors-ligne) et envoie une notification "Alerte de conflit de stock" à l'administrateur.

### Améliorations Futures (Interface & UX)
- **Calendriers Avancés :** Sélection des plages de dates avec animation de glissement.
- **Thématisation :** Permettre aux utilisateurs de choisir la couleur d'accentuation (au lieu de seulement bleu/rouge).

## 9. Fonctionnement Hors-Ligne (PWA & Offline First)
- **Diff-Sync pour le Catalogue :** Actuellement, le `syncDown` supprime et remet l'intégralité du catalogue. À l'avenir, implémenter un "Delta Sync" (ou Diff-Sync) qui ne télécharge que les lignes ajoutées/modifiées depuis le dernier horodatage afin d'économiser de la bande passante sur mobile.
- **Support des Achats & Dépenses :** Étendre l'infrastructure Offline (IndexedDB) aux autres modules comme les Achats et les Dépenses (pour le moment, seules les ventes disposent d'une file d'attente hors-ligne).


### Améliorations Futures (Synchronisation)
- **File d'attente avancée :** Afficher un historique visuel détaillé (liste) des ventes synchronisées avec leurs statuts (succès, échec) directement dans un panneau latéral en cliquant sur le nuage.
- **Notification push :** Envoyer une alerte sonore ou une notification native à l'administrateur lorsqu'une boutique se déconnecte du réseau pendant les heures d'ouverture.

### Améliorations Futures (Achats & IA)
- **Graphique d'évolution des prix :** Afficher une petite courbe (sparkline) montrant l'inflation ou la baisse du prix d'une pièce chez un fournisseur sélectionné au fil des mois.
- **Alerte de marge :** Bloquer ou alerter le vendeur si le prix de vente saisi est inférieur au prix d'achat moyen calculé dynamiquement.