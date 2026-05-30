# AINA PIÈCE AUTO - ERP

## Description du Projet
Application web (ERP) sur-mesure pour la gestion complète des boutiques Aina Pièce Auto. Conçue avec un design sombre, moderne (Glassmorphism), et responsive (Mobile & Desktop).

**URL Production :** https://aina-piece-auto.vercel.app  
**Repository :** https://github.com/Aintsoa-ai/aina-piece-auto

---

## Fonctionnalités Actuelles (Validées et Opérationnelles)

### 1. Authentification & Sécurité
- Connexion sécurisée via Supabase.
- Gestion des sessions utilisateurs et permissions basées sur les rôles (Administrateur, Caissier).
- **Blindage Admin :** L'email administrateur (`ainapieces2026@gmail.com`) est sécurisé en dur — impossible de perdre ses droits.

### 2. Tableau de Bord (Dashboard)
- Calcul **en temps réel** basé sur les vraies données de la base.
- Affichage du Capital Investi, Valeur du Stock, Solde en Caisse, et Ventes du Jour.
- Graphiques dynamiques des revenus et dépenses.
- **Correction fuseau horaire :** filtre date locale Madagascar (UTC+3) — plus d'affichage 0 Ar.

### 3. Gestion des Ventes (Caisse & Panier)
- **Système de Panier (Vente Multiple) :** Interface à double panneau permettant d'ajouter plusieurs pièces avec calcul dynamique du total.
- **Intégration Douchette (Scan Rapide) :** Prise en charge native des lecteurs de codes-barres (AZERTY/QWERTY, délai 100ms). Scan-to-Open : ouvre automatiquement la bonne fenêtre.
- **Mode Scan Manuel (Fallback) :** Recherche manuelle + Entrée pour simuler la douchette. Compatible Mobile/Desktop.
- **Inventaire Éclair :** Scan d'une pièce → filtre instantané dans le catalogue.
- **Sélection Intelligente :** Recherche fluide avec boutons d'ajustement de quantité dans le panier.
- **Caisse Intelligente :** Fenêtre d'encaissement avec calcul automatique du reste à rendre. Espèces reçues et monnaie rendue imprimées sur le ticket.
- **Impression Thermique Auto-Adaptable :** CSS `@media print` natif, compatible 58mm et 80mm.
- **Impression Thermique Automatique :** Option activable dans Paramètres → Système. Quand activée, le ticket s'imprime automatiquement à chaque validation. Si pas d'imprimante, le navigateur propose de sauvegarder en **PDF**.
- **Remboursements et Retours Clients :** Fonction exclusive Admin — annule la vente, recrédite le stock, trace le mouvement.
- **Ventes à Crédit (Garages) :** Associe une transaction à un compte Client/Garage. Total ajouté à la dette sans fausser les encaissements.
- Calcul automatique du bénéfice basé sur le dernier prix d'achat.

### 4. Gestion des Achats & Fournisseurs
- Panneau de comparaison des prix fournisseurs en temps réel avec historique d'évolution (+/-%).
- **Scan à la Réception :** Douchette pour identifier la marchandise reçue.
- Ajout de stock automatique lors d'un achat.

### 5. Catalogue & Stock
- Affichage complet des pièces avec gestion des quantités.
- **Gestion des Codes-barres :** Ajout/modification via douchette dans "Nouvelle Pièce".
- **Génération & Impression d'Étiquettes :** API bwip-js, format 50x30mm thermique.
- **Importation Massive & Intelligente :** Fichier Excel `.xlsx`, déduplication (remplacer/mettre à jour/ignorer), option GLOBAL (toutes boutiques), colonne `CODE_BARRE` reconnue automatiquement.
- **Option GLOBAL :** Quantité divisée équitablement entre les boutiques actives.

### 6. Rapports et Exports — UNIFORMISÉS (3 formats identiques)
- **Exports Multiformats :** Excel, Word et PDF contiennent désormais exactement les mêmes informations :
  - En-tête entreprise (NIF, STAT, adresse, contacts)
  - **KPIs financiers** : Chiffre d'affaires, Coût achats, Charges, Bénéfice net, Articles vendus
  - **Tableau Top 10 Produits** : Qté vendue, CA, Bénéfice estimé, Marge %
  - **Alertes Stock bas** : Références sous le seuil minimum
- **Excel** : Feuille "Analyse Globale" (miroir du PDF) + feuilles détaillées (Ventes, Achats, Dépenses, Stock)
- **PDF** : Template exécutif haut de gamme (vert sarcelle/gris charbon), graphiques SVG vectoriels, styles inline.
- **Word** : Même template HTML que le PDF, importable dans Microsoft Word.
- **Filtres Avancés :** Par plage de dates et par boutique spécifique.

### 7. Clients & Crédits
- Module complet de suivi des factures impayées des Garages Partenaires.
- Vue centralisée des dettes par client.
- **Encaissement de règlements** avec indicateurs dynamiques en temps réel :
  - **Reste à payer** (rouge si > 0, vert si soldé)
  - **Reste à rendre** (vert si excédent à rendre au client)
- Le paiement borné au montant de la dette (pas de solde négatif).
- **Enregistrement au tableau de vente :** Chaque règlement apparaît dans la liste des ventes sous "Règlement Crédit - [Nom client]".
- **Code couleur dans les ventes :** Les lignes crédit/règlement crédit s'affichent en rouge léger (fond + bordure gauche) si la dette est encore ouverte. Deviennent normales une fois tous les dettes soldées.

### 8. Maintenance & Sécurité (Points de Sauvegarde)
- **Sauvegarde Intelligente :** Création de "Points de Sauvegarde" de l'état complet de l'ERP.
- **Sauvegarde Cloud Native (Drive) :** Upload vers un Storage Bucket Supabase (1 Go automatisé).
- **Restauration :** Importation du fichier de backup.
- **Purge de base :** Nettoyage de l'historique par période sans altérer le stock.

### 9. Gestion Multi-Boutique et Accès (Matrice Cloud)
- **Radar de Présence :** Tableau de bord indiquant en temps réel quelle boutique est connectée (heartbeat 5min).
- **Création de Caissiers Autonomes :** Admin crée des comptes Email/MDP pour les boutiques.
- **Mode Caissier Restreint :** Accès limité aux modules autorisés pour cette boutique.
- **Matrice des Autorisations (Cloud) :** Contrôle granulaire par boutique/page. Sauvegardé sur Supabase.
- **Sécurité Invisible (RLS) :** Cloisonnement physique des données au niveau de la base.
- **Simulateur de Boutique :** Mode "Simuler Accès" pour l'admin.
- **Verrouillage Horaire :** Configuration heures d'ouverture/fermeture. Écran rouge en dehors des heures.
- **Alerte Fermeture :** Popup animée 15 min avant la fermeture.

### 10. Déploiement Production (Cloud)
- **Hébergement :** Vercel (`aina-piece-auto.vercel.app`), déploiement continu.
- **Synchronisation GitHub :** `git push` → nouvelle version auto.
- **Gestion des Clés :** Variables d'environnement masquées côté serveur.

### 11. Fonctionnement Hors-Ligne (PWA & IndexedDB)
- **Base de Données Locale :** Dexie.js (IndexedDB) pour cache catalogue et stock.
- **Mode Hors-Ligne Total :** Ventes, Achats, Dépenses en file locale.
- **Synchronisation Automatique :** Sync au retour de la connexion Internet.
- **Statut Temps Réel :** Pastille En Ligne/Hors-Ligne avec compteur de ventes en attente.

### 12. Interface & UX
- **Calendriers Personnalisés :** `react-datepicker` en thème sombre Glassmorphism. Activité passée en rouge, aujourd'hui en bleu.
- **Boîtes de Dialogue :** `SweetAlert2` en thème sombre (remplace les alerts natifs).
- **Responsive Total :** Desktop (menu fixe) + Mobile (hamburger). 100dvh pour les claviers virtuels.
- **Identité Visuelle Adaptative :** Menu latéral personnalisé par boutique connectée.

### 13. Hard Reset (Factory Reset)
- Purge sélective : Transactions, Catalogue, Fournisseurs, Utilisateurs, Boutiques, Clients/Crédits, Caisse.
- Admin "blindé" en dur — impossible d'effacer le compte admin.

---

## Compatibilité Matérielle
- **Ordinateur (Desktop) :** Interface complète avec menu latéral fixe.
- **Téléphone (Mobile) :** Interface responsive. Toutes fonctionnalités opérationnelles.
- **Imprimante Thermique 58mm ou 80mm :** Ticket natif via `window.print()`.
- **Douchette Code-barres USB :** Plug-and-play, AZERTY/QWERTY, 100ms de tolérance.

---

## 📍 POINT DE SAUVEGARDE v3 — 31/05/2026 01:30 (Madagascar, UTC+3)

**Hash Git :** `bf31ff8` (avant) → en cours de déploiement  
**URL Production :** https://aina-piece-auto.vercel.app

### Nouvelles fonctionnalités ajoutées (31/05/2026)
- ✅ **Uniformisation exports (PDF = Word = Excel)** : L'Excel contient maintenant une feuille "Analyse Globale" avec exactement les mêmes KPIs, top produits et alertes stock que le PDF/Word.
- ✅ **Impression thermique automatique** : Option dans Paramètres → Système. Quand activée, le ticket s'imprime dès validation. Fallback PDF automatique si pas d'imprimante.
- ✅ **Règlements crédit → Tableau de vente** : Chaque encaissement client est maintenant envoyé dans la liste des ventes avec statut `REGLEMENT_CREDIT`.
- ✅ **Code couleur crédits en attente** : Lignes rouges dans le tableau Ventes si dette encore ouverte, normales une fois soldées.
- ✅ **Calcul dynamique modal Encaisser** : "Reste à payer" et "Reste à rendre" calculés en temps réel pendant la frappe.

*Toutes les fonctionnalités sont testées et opérationnelles sur Mobile et Desktop.*
