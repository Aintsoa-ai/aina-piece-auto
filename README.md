# AINA PIÈCE AUTO - ERP

## Description du Projet
Application web (ERP) sur-mesure pour la gestion complète des boutiques Aina Pièce Auto. Conçue avec un design sombre, moderne (Glassmorphism), et responsive (Mobile & Desktop).

## Fonctionnalités Actuelles (Validées et Opérationnelles)

### 1. Authentification & Sécurité
- Connexion sécurisée via Supabase.
- Gestion des sessions utilisateurs et permissions basées sur les rôles (Administrateur, Caissier).

### 2. Tableau de Bord (Dashboard)
- Calcul **en temps réel** basé sur les vraies données de la base.
- Affichage du Capital Investi, Valeur du Stock, Solde en Caisse, et Ventes du Jour.
- Graphiques dynamiques des revenus et dépenses.

### 3. Gestion des Ventes (Caisse & Panier)
- **Système de Panier (Vente Multiple) :** Interface à double panneau permettant d'ajouter plusieurs pièces avec calcul dynamique du total.
- **Intégration Douchette (Scan Rapide) :** Prise en charge native des lecteurs de codes-barres de bout en bout (Caisse, Achats, Catalogue). L'algorithme distingue une saisie humaine d'un scan matériel.
- **Mode Scan Manuel (Fallback) :** Possibilité de rechercher manuellement un code-barres et d'appuyer sur "Entrée" pour simuler une douchette. Totalement compatible Mobile et Desktop.
- **Inventaire Éclair :** Sur la liste du catalogue, le scan d'une pièce filtre instantanément la vue pour afficher ses informations de stock et de prix.
- **Importation de Masse avec Codes-barres :** L'outil d'importation Excel reconnait et intègre automatiquement la colonne `CODE_BARRE`, permettant d'initialiser des centaines de références sans scan manuel.
- **Sélection Intelligente :** Recherche fluide avec boutons d'ajustement de quantité directement dans le panier.
- **Impression Thermique Auto-Adaptable :** Formatage natif (CSS @media print) qui s'adapte automatiquement à n'importe quelle imprimante thermique (58mm ou 80mm) générant un véritable ticket de caisse.
- **Remboursements et Retours Clients :** Fonction exclusive (Réservée Admin) pour annuler une vente. L'opération supprime la transaction, recrédite le stock avec exactitude et trace le mouvement dans l'historique d'inventaire.
- **Ventes à Crédit (Garages) :** Le module permet d'associer une transaction à un compte "Client/Garage". Le total s'ajoute à la dette du garage sans fausser les encaissements du jour.
- Calcul automatique du bénéfice basé sur le dernier prix d'achat.

### 4. Gestion des Achats & Fournisseurs
- Panneau de comparaison des prix fournisseurs en temps réel.
- **Scan à la Réception :** Utilisation de la douchette pour identifier instantanément la marchandise reçue.
- Ajout de stock automatique lors d'un achat.

### 5. Catalogue & Stock
- Affichage complet des pièces avec gestion des quantités.
- **Gestion des Codes-barres :** Ajout ou modification des codes-barres d'une pièce directement via la douchette dans la fenêtre "Nouvelle Pièce".
- **Génération & Impression d'Étiquettes :** Génération dynamique (API bwip-js) et impression d'autocollants code-barres au format (50x30mm) directement sur imprimante thermique. 
- **Importation Massive & Intelligente :** Importation depuis un fichier Excel (`.xlsx`). Gestion des doublons (remplacer, mettre à jour, ignorer) et sélecteur de destination avec option de "Déploiement Global" (Toutes les boutiques). Protection d'intégrité (lignes sans REF ignorées).

### 6. Rapports et Exports
- **Exports Multiformats :** Génération de rapports en Excel, Word, et PDF.
- **Rapport Exécutif (PDF) :** Template d'entreprise haut de gamme (thème Vert Sarcelle/Gris Charbon) avec graphiques circulaires et barres + courbe d'évolution (100% SVG vectoriel natif). Tous les styles sont en `style="..."` *inline* pour contourner la limitation de `html2canvas` qui ignore les blocs `<style>` — garantissant couleurs, textes et fonds visibles sur Ordinateur et Téléphone.
- **Filtres Avancés :** Filtrage des rapports par plage de dates et *par boutique spécifique*.
- **Calendrier & Repères :** Affichage intelligent de l'activité sur le calendrier (Bleu = Aujourd'hui local, Rouge = Activité), avec synchronisation parfaite des fuseaux horaires.
- **Intelligence :** Top Ventes, alertes de stocks faibles, formatage de dates en JJ-MM-AAAA.

### 7. Maintenance & Sécurité (Points de Sauvegarde)
- **Sauvegarde Intelligente :** Création de "Points de Sauvegarde" de l'état complet de l'ERP.
- **Sauvegarde Cloud Native (Drive) :** Upload silencieux et sécurisé des fichiers de sauvegarde vers un Storage Bucket intégré à Supabase (1 Go d'espace, totalement automatisé pour remplacer l'ancienne méthode par email).
- **Restauration :** Importation du fichier en cas de vol du matériel.
- **Purge de base :** Fonction pour nettoyer l'historique d'une période sans altérer le stock.

### 8. Gestion Multi-Boutique et Accès (Matrice Cloud)
- **Radar de Présence :** Tableau de bord indiquant en temps réel quelle boutique est connectée (voyant vert clignotant, système de "Heartbeat" toutes les 5 min). Corrigé pour détecter précisément chaque boutique sans interférence.
- **Création de Caissiers Autonomes :** L'administrateur peut créer des identifiants (Email/MDP) exclusifs pour les boutiques avec un système d'assignation robuste (upsert) pour éviter les profils orphelins.
- **Mode Caissier Restreint :** Dès qu'un compte "Boutique" se connecte, l'accès aux paramètres est bloqué et les ventes sont assignées à la boutique concernée.
- **Matrice des Autorisations (Cloud) :** Contrôle total et granulaire de l'affichage des menus (Ventes, Achats, Stock, etc.) pour chaque boutique. La configuration est sauvegardée sur Supabase pour s'appliquer instantanément et universellement à tous les téléphones et ordinateurs connectés.
- **Sécurité Invisible (RLS) :** Cloisonnement physique des données de ventes, caisse et dépenses directement au niveau de la base de données. Il est impossible pour une boutique d'accéder aux données financières d'une autre boutique, même par piratage direct de l'API.
- **Simulateur de Boutique :** Un mode "Simuler Accès" permettant au patron de se glisser dans la peau d'un caissier spécifique pour vérifier son interface instantanément.

### 9. Déploiement Production (Cloud)
- **Hébergement :** Application déployée en continu sur **Vercel** (`aina-piece-auto.vercel.app`).
- **Synchronisation GitHub :** Chaque mise à jour du code (`git push`) déclenche automatiquement une nouvelle version de production.
- **Gestion des Clés :** Variables d'environnement masquées côté serveur.

### 10. Nettoyage de Base (Hard Reset)
- **Déploiement Initial :** Avant le lancement, exécution d'un script `reset_db.ts` côté serveur utilisant la clé de service (`SERVICE_ROLE_KEY`) pour supprimer en cascade toutes les boutiques (effaçant instantanément ventes, stock, achats) afin de démarrer sur une base 100% vierge.

### 11. Fonctionnement Hors-Ligne (PWA & IndexedDB)
- **Base de Données Locale :** Utilisation de `Dexie.js` pour créer une base de données IndexedDB stockant un cache du catalogue et le stock disponible (syncDown).
- **Mode Hors-Ligne Total (Ventes, Achats, Dépenses) :** En cas de coupure WiFi, l'ERP sauvegarde l'intégralité des transactions métier dans des files d'attente locales.
- **Synchronisation Automatique :** Dès le retour de la connexion Internet, un écouteur déclenche automatiquement un `syncUp`, poussant la file d'attente directement sur Supabase, mettant ainsi à jour l'interface de l'Administrateur instantanément.
- **Statut en Temps Réel :** Le panneau d'administration affiche la pastille (Mode En Ligne / Hors-Ligne) avec le compte des ventes en attente.

## Compatibilité Matérielle
- **Ordinateur (Desktop) :** Interface complète avec menu latéral fixe.
- **Téléphone (Mobile) :** Interface "Responsive" avec menu hamburger et cartes. Aucune fonctionnalité n'est altérée. (Ex: Le blocage du mode caissier et l'export des rapports fonctionnent parfaitement sur Mobile). L'ergonomie prend en compte les claviers virtuels (`100dvh`, défilement actif) pour ne jamais bloquer la saisie.

### 11. Modernisation de l'Interface (UX/UI)
- **Calendriers Personnalisés :** Remplacement des entrées natives (`<input type="date">`) par des calendriers `react-datepicker` en thème sombre (Glassmorphism). Affichage dynamique des dates d'activités passées en **rouge** et de la date du jour en **bleu**.
- **Boîtes de Dialogue :** Remplacement total des `alert()`, `confirm()` et `prompt()` natifs du navigateur par des interfaces professionnelles (`SweetAlert2`) avec intégration parfaite du thème sombre.

## Fonctionnalités Récentes (Mai 2026)
- **Véritable Mode Hors-Ligne :** L'application fonctionne en tant que Progressive Web App (PWA). Les ventes peuvent être saisies sans internet et sont stockées localement (IndexedDB). Un indicateur visuel (Nuage) permet de suivre la synchronisation au retour du réseau.
- **Suivi des connexions en Temps Réel :** Le PC administrateur peut voir en moins de 2 secondes si le téléphone d'une boutique s'est déconnecté du réseau, grâce au système WebSocket de Supabase (Presence).
- **Tableau de bord réactif :** Le Dashboard s'actualise de lui-même dès que des ventes synchronisées arrivent dans la base.
- **Import Excel Ultra-Rapide & Intelligent :** Refonte du moteur d'importation. Dédoublonnage instantané en mémoire et insertion massive en parallèle. Le système gère intelligemment les bases de données dont les schémas diffèrent (fallback automatique sans plantage).
- **Maintenance Globale (Factory Reset) :** Outil intégré de purge sécurisée avec sélection précise (Transactions, Catalogue, Fournisseurs, Numérotation).
- **Monitoring Supabase :** Affichage d'une jauge en temps réel sur le tableau de bord pour contrôler l'espace de stockage de la base de données.
- **Identité Visuelle Adaptative :** Le menu latéral détecte automatiquement la boutique connectée, personnalisant le nom et l'icône, remplaçant l'affichage générique "OFFICIEL".

## Fonctionnalités Avancées (Mise à jour)
- **Comparateur Intelligent & Historique d'Évolution :** Lors d'un réapprovisionnement, l'application analyse l'historique complet et calcule la tendance d'inflation (ex: +15% de hausse du prix d'achat) pour vous recommander le "MEILLEUR" prix.
- **Douchette Code-barres (POS) :** Déploiement d'un écouteur global asynchrone permettant le scan matériel dans toutes les interfaces transactionnelles (Ventes, Achats). Le système est Plug-and-Play (clavier USB émulé).
- **Gestion des Clients (Avoirs / Crédits) :** Un module complet dédié au suivi des factures impayées des Garages Partenaires. Vue centralisée des dettes et module d'encaissement de règlements partiels (compatibles hors-ligne).

---

**📍 POINT DE SAUVEGARDE : (Mai 2026)**
*L'application est certifiée stable sur Mobile et Desktop. L'intégration PWA hors-ligne, la synchronisation Supabase temps réel, et la prise en charge des périphériques matériels (Imprimante Thermique, Douchette Code-barres) sont testées, documentées et pleinement opérationnelles.*
### Nouvelles fonctionnalit�s valid�es (27/05/2026 13:02)
- **Caisse Intelligente :** Fen�tre d'encaissement interm�diaire avec calcul automatique du reste � rendre, et impression sur le ticket thermique de l'esp�ce re�ue et de la monnaie rendue.
- **Gestion Multi-boutiques (Catalogue) :** Possibilit� d'assigner une nouvelle pi�ce � TOUTES les boutiques (option GLOBAL) d�s la cr�ation ou modification.
- **Compatibilit� Scanner Universelle :** Plug & play complet pour les douchettes param�tr�es en AZERTY ou QWERTY, avec algorithme anti-micro-coupures (tol�rance 500ms).
