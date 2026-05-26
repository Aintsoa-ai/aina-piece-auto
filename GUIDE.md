# 📖 GUIDE COMPLET DU PROJET : AINA PIÈCE AUTO (ERP)

Ce document est le manuel définitif et technique de l'application. Si vous reprenez ce projet de zéro ou si vous êtes un nouveau développeur, **lisez ce document dans son intégralité**. Il contient l'architecture, la logique métier et toutes les subtilités du code.

---

## 1. VUE D'ENSEMBLE DU PROJET
**Aina Pièce Auto** est un ERP (Entreprise Resource Planning) spécialisé pour les magasins de vente de pièces détachées automobiles. Il a été conçu pour être :
- **Multi-boutique :** Gestion centralisée d'un réseau de magasins physiques.
- **Hybride (Online / Offline) :** Conçu pour Madagascar et les pays où la connexion Internet est instable. Il fonctionne via une **PWA (Progressive Web App)** capable de stocker les ventes localement en cas de coupure réseau.
- **Réactif (Responsive) :** Interface identique et fluide sur Ordinateur (Desktop) et Téléphone (Mobile), sans jamais masquer les champs de saisie sous le clavier virtuel.

## 2. STACK TECHNIQUE (LES TECHNOLOGIES)
- **Frontend :** React (TypeScript) + Vite
- **Base de données principale (Cloud) :** Supabase (PostgreSQL)
- **Base de données locale (Hors-ligne) :** Dexie.js (Wrapper pour IndexedDB)
- **Hébergement & Déploiement :** Vercel (CI/CD via GitHub)
- **Génération de PDF :** `html2pdf.js` (Rendu via `html2canvas` et `jsPDF`)
- **Code-barres :** `bwip-js` (Génération des étiquettes)
- **Icônes :** `lucide-react`
- **Alertes :** `SweetAlert2`

---

## 3. ARCHITECTURE DE LA BASE DE DONNÉES (SUPABASE)
Le projet repose sur une base de données relationnelle stricte. 
Voici les tables principales :
1. **`boutiques`** : Les magasins physiques (ex: Centre, Nord).
2. **`profiles`** : Liée à `auth.users` de Supabase. Gère les rôles (`administrateur` ou `caissier`) et lie un caissier à une `boutique_id`.
3. **`pieces`** : Le catalogue global (référence, désignation, prix, code-barre).
4. **`stock`** : Fait la liaison entre `piece_id` et `boutique_id`. **Le stock est propre à chaque boutique.**
5. **`ventes` & `details_ventes`** : En-tête de facture et lignes d'articles vendus.
6. **`achats` & `details_achats`** : Historique d'approvisionnement (lié aux fournisseurs).
7. **`fournisseurs`** : Liste des grossistes.
8. **`mouvements_stock`** : Historique traçable de toutes les entrées/sorties (Audit log).
9. **`clients` & `reglements_credits`** : Module B2B pour la gestion des garages partenaires et de leurs dettes (Ventes à crédit).
10. **`app_settings`** : Table contenant un JSON unique (`id = 'global'`) pilotant la **Matrice des Autorisations** en temps réel sur tous les appareils.

---

## 4. GESTION DES RÔLES ET SÉCURITÉ

### 4.1. Row Level Security (RLS) dans Supabase
La base de données est cloisonnée. Un caissier de la Boutique A **ne peut pas** voir les ventes ou la caisse de la Boutique B. 
Des politiques SQL RLS (`CREATE POLICY... USING (boutique_id = auth.uid()...)`) protègent les tables financières. L'Administrateur contourne ces règles.

### 4.2. Matrice des Autorisations Cloud
Plutôt que de coder les accès en dur dans React, l'interface (`Settings.tsx`) possède une matrice. 
Chaque utilisateur (ou boutique) possède des "permissions de pages" (ex: `caisse: true, depenses: false`).
- Ce JSON est synchronisé sur Supabase et stocké localement via `SettingsContext.tsx`.

### 4.3. Radar de Présence
Dans `Layout.tsx`, une fonction "Heartbeat" s'exécute toutes les 5 minutes et met à jour la colonne `last_login`. L'Administrateur sait ainsi en direct quelle boutique est en ligne (voyant vert) ou hors-ligne (voyant gris).

---

## 5. LE MODE HORS-LIGNE (L'ÉPINE DORSALE)
C'est la fonctionnalité la plus complexe et vitale de l'application.

1. **`syncManager.ts`** : Le chef d'orchestre.
2. **SyncDown (Téléchargement) :** Dès qu'internet est présent, l'app télécharge tout le catalogue (`pieces`) et le `stock` de la boutique locale dans la base de données du navigateur (IndexedDB via Dexie).
3. **La Vente Sans Réseau :** Si le wifi coupe, la vente s'enregistre dans `db.pending_ventes` (Local). Elle prend le statut "CREDIT" ou "PAYE" localement.
4. **SyncUp (Remontée) :** Au retour de la connexion, `window.addEventListener('online', ...)` se déclenche. `syncManager.ts` lit IndexedDB et pousse silencieusement toutes les ventes en attente vers Supabase.

⚠️ **Ne touchez pas au schéma IndexedDB (`db.ts`) sans comprendre les conséquences sur la file d'attente des caisses non synchronisées.**

---

## 6. LOGIQUES MÉTIER CLÉS

### 6.1. Module Caisse & Douchette (Code-barres)
- **Le problème des douchettes :** Une douchette agit comme un clavier USB qui tape très vite.
- **La solution :** Un écouteur global asynchrone mesure le temps entre deux frappes de touche. Si le délai est `< 50ms`, l'application comprend qu'il s'agit du scanner matériel et ajoute la pièce au panier automatiquement sans que l'utilisateur n'ait besoin de cliquer dans une barre de recherche.

### 6.2. Générateur de Rapports (PDF)
- **Le piège classique :** `html2canvas` (utilisé pour les PDF) **ignore les balises `<style>` et le CSS externe.**
- **La solution :** Tous les styles des rapports PDF (dans `ExportExcel.tsx` ou `ReportGenerator`) sont codés en "inline" (`style={{ backgroundColor: 'red' }}`). C'est obligatoire pour garantir que les couleurs s'impriment correctement.

### 6.3. Remboursement & Avoirs
- Un administrateur peut "Annuler" une vente depuis l'historique. 
- **Comportement :** Cela supprime la vente, mais SURTOUT, cela ré-ajoute la quantité au stock et trace un mouvement de type "ENTREE" pour justifier la manipulation d'inventaire.

### 6.4. Importation Excel Rapide
L'algorithme (`ImportExcel.tsx`) est optimisé pour des milliers de lignes. Il regroupe les références identiques (Dédoublonnage) en mémoire, puis exécute des requêtes de création massives sur Supabase en ignorant intelligemment les erreurs de schéma manquant (Fallback automatique).

---

## 7. MAINTENANCE ET DÉPLOIEMENT

### 7.1. Comment effacer toutes les données ? (Factory Reset)
Si vous devez remettre l'ERP à zéro :
1. Soit via l'application (Menu Paramètres > Bouton **Réinitialiser**).
2. Soit via le script `reset_db.ts` (Nécessite la clé Service Role `SERVICE_ROLE_KEY`) qui effectue une suppression en cascade (effacer les boutiques efface automatiquement tout le reste grâce aux contraintes SQL `ON DELETE CASCADE`).

### 7.2. Déploiement Cloud (Vercel)
Chaque `git push` sur la branche `main` déclenche un build sur Vercel. 
Variables d'environnement requises sur Vercel :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 7.3. Exécuter un Script SQL
Pour toute mise à jour de la base de données (ajout d'une colonne, création d'une politique RLS), tout se passe dans l'**Éditeur SQL** du tableau de bord Supabase en ligne. Les fichiers locaux (ex: `credits_schema.sql`) servent uniquement de copie de sauvegarde ou de documentation.

---

## 8. RÈGLES D'OR POUR LE DÉVELOPPEUR FUTUR
1. **Pensez toujours Mobile :** Chaque champ, popup, ou bouton doit être testé avec l'inspecteur "Vue Mobile" du navigateur. L'utilisation de `100dvh` (au lieu de `vh`) empêche la page de se casser quand le clavier virtuel apparaît.
2. **Ne Cassez Jamais le Mode Offline :** Si vous modifiez la structure de la table `ventes` sur Supabase, vous devez **absolument** modifier `PendingVente` dans `db.ts` et mettre à jour `syncManager.ts` pour gérer le mode hors-ligne de cette nouvelle colonne.
3. **Styles CSS :** L'application utilise du style "Inline" et des objets de style JS (`const s = { ... }`). Conservez cette logique. Le "Glassmorphism" (fond transparent et bordures floues) fait l'identité visuelle de l'ERP.

---
*Ce guide a été généré par l'IA experte afin d'assurer la pérennité du système Aina Pièce Auto. L'architecture est solide, prête à supporter l'expansion du réseau de boutiques du client.*
