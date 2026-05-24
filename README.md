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
- **Sélection Intelligente :** Recherche fluide avec boutons d'ajustement de quantité directement dans le panier.
- **Impression Thermique Auto-Adaptable :** Formatage natif (CSS @media print) qui s'adapte automatiquement à n'importe quelle imprimante thermique (58mm ou 80mm) générant un véritable ticket de caisse.
- Calcul automatique du bénéfice basé sur le dernier prix d'achat.

### 4. Gestion des Achats & Fournisseurs
- Panneau de comparaison des prix fournisseurs en temps réel.
- Ajout de stock automatique lors d'un achat.

### 5. Catalogue & Stock
- Affichage complet des pièces avec gestion des quantités.
- **Importation Massive & Intelligente :** Importation depuis un fichier Excel (`.xlsx`). Gestion des doublons (remplacer, mettre à jour, ignorer) et sélecteur de destination avec option de "Déploiement Global" (Toutes les boutiques). Protection d'intégrité (lignes sans REF ignorées).

### 6. Rapports et Exports
- **Exports Multiformats :** Génération de rapports en Excel, Word, PDF, et PowerPoint.
- **Rapport Exécutif (PDF) :** Template d'entreprise haut de gamme (thème Vert Sarcelle/Gris Charbon) avec graphiques circulaires et barres + courbe d'évolution (100% SVG vectoriel natif). Tous les styles sont en `style="..."` *inline* pour contourner la limitation de `html2canvas` qui ignore les blocs `<style>` — garantissant couleurs, textes et fonds visibles sur Ordinateur et Téléphone.
- **Filtres Avancés :** Filtrage des rapports par plage de dates et *par boutique spécifique*.
- **Calendrier & Repères :** Affichage intelligent de l'activité sur le calendrier (Bleu = Aujourd'hui local, Rouge = Activité), avec synchronisation parfaite des fuseaux horaires.
- **Intelligence :** Top Ventes, alertes de stocks faibles, formatage de dates en JJ-MM-AAAA.

### 7. Maintenance & Sécurité (Points de Sauvegarde)
- **Sauvegarde Intelligente :** Création de "Points de Sauvegarde" de l'état complet de l'ERP.
- **Alerte Email :** Envoi automatique (via API FormSubmit) avec un résumé et fichier crypté.
- **Restauration :** Importation du fichier en cas de vol du matériel.
- **Purge de base :** Fonction pour nettoyer l'historique d'une période sans altérer le stock.

### 8. Gestion Multi-Boutique et Accès (Matrice Cloud)
- **Radar de Présence :** Tableau de bord indiquant en temps réel quelle boutique est connectée (voyant vert clignotant, système de "Heartbeat" toutes les 5 min).
- **Création de Caissiers Autonomes :** L'administrateur peut créer directement depuis l'application des identifiants (Email/MDP) exclusifs pour les boutiques, sans passer par Supabase.
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

## Compatibilité Matérielle
- **Ordinateur (Desktop) :** Interface complète avec menu latéral fixe.
- **Téléphone (Mobile) :** Interface "Responsive" avec menu hamburger et cartes. Aucune fonctionnalité n'est altérée. (Ex: Le blocage du mode caissier et l'export des rapports fonctionnent parfaitement sur Mobile).
