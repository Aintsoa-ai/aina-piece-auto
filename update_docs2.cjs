const fs = require('fs');

let plan = fs.readFileSync('plan.md', 'utf8');
if (!plan.includes('Phase 7')) {
  plan += '\n\n## Phase 7 : Véritable Système Hors-Ligne (PWA & IndexedDB) - TERMINÉ\n- [x] Remplacement du système de simulation statique par une file d\'attente réelle via Dexie.js (IndexedDB).\n- [x] Suivi en temps réel de la connectivité et détection des coupures via WebSocket (Supabase Presence).\n- [x] Ajout d\'un indicateur visuel (Nuage) signalant les données en attente et permettant la synchronisation forcée.\n- [x] Auto-actualisation du Tableau de bord administrateur après réception d\'une synchronisation hors-ligne.';
  fs.writeFileSync('plan.md', plan);
}

let audit = fs.readFileSync('auDit.md', 'utf8');
audit += '\n\n### AUDIT: 25 Mai 2026 - Système Hors-Ligne & Synchronisation PWA\n- **Problème initial :** Les ventes effectuées hors-ligne n\'arrivaient pas dans la base de données en raison d\'une erreur de syntaxe UUID (champ ID vide converti en string au lieu de null) et le Tableau de bord ne s\'actualisait pas tout seul.\n- **Solution :** Refonte totale du composant `syncManager.ts` pour gérer l\'export Dexie vers Supabase. Les ID manquants sont convertis en `null`. Intégration de Supabase Presence dans `Layout.tsx` et `Settings.tsx` pour que l\'administrateur voit en temps réel si une boutique se déconnecte (délai inférieur à 2 secondes).\n- **Interface :** Ajout d\'un bouton Nuage intelligent affichant un compteur dynamique du nombre de ventes coincées sur le téléphone.\n- **Déploiement :** Résolution d\'une erreur TS stricte empêchant Vercel de compiler, puis forçage du déploiement en production.';
fs.writeFileSync('auDit.md', audit);

let readme = fs.readFileSync('README.md', 'utf8');
if (!readme.includes('## Fonctionnalités Récentes (Mai 2026)')) {
  readme += '\n\n## Fonctionnalités Récentes (Mai 2026)\n- **Véritable Mode Hors-Ligne :** L\'application fonctionne en tant que Progressive Web App (PWA). Les ventes peuvent être saisies sans internet et sont stockées localement (IndexedDB). Un indicateur visuel (Nuage) permet de suivre la synchronisation au retour du réseau.\n- **Suivi des connexions en Temps Réel :** Le PC administrateur peut voir en moins de 2 secondes si le téléphone d\'une boutique s\'est déconnecté du réseau, grâce au système WebSocket de Supabase (Presence).\n- **Tableau de bord réactif :** Le Dashboard s\'actualise de lui-même dès que des ventes synchronisées arrivent dans la base.';
  fs.writeFileSync('README.md', readme);
}

let idees = fs.readFileSync('nos_idees.md', 'utf8');
idees += '\n\n### Améliorations Futures (Synchronisation)\n- **File d\'attente avancée :** Afficher un historique visuel détaillé (liste) des ventes synchronisées avec leurs statuts (succès, échec) directement dans un panneau latéral en cliquant sur le nuage.\n- **Notification push :** Envoyer une alerte sonore ou une notification native à l\'administrateur lorsqu\'une boutique se déconnecte du réseau pendant les heures d\'ouverture.';
fs.writeFileSync('nos_idees.md', idees);

console.log('Fichiers de documentation mis à jour avec la Phase 7 !');
