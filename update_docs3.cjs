const fs = require('fs');

let plan = fs.readFileSync('plan.md', 'utf8');
if (!plan.includes('Comparateur dynamique de fournisseurs')) {
  plan += '\n\n## Mise à jour Phase 7 : Fonctionnalités Intelligentes\n- [x] Comparateur dynamique de fournisseurs : Calcul instantané du meilleur prix d\'achat basé sur l\'historique réel de la base de données au lieu de données simulées.\n- [x] Résolution de la défaillance de rafraîchissement d\'état (stale closure) sur l\'indicateur de connexion des boutiques.';
  fs.writeFileSync('plan.md', plan);
}

let audit = fs.readFileSync('auDit.md', 'utf8');
audit += '\n\n### AUDIT: 25 Mai 2026 (Soirée) - Fiabilisation Temps Réel & Algorithme d\'Achats\n- **Problème de présence (Stale Closure) :** Le minuteur automatique de 60s réinitialisait la détection de présence à cause d\'une faille de mémoire React (closure). Corrigé via un `useRef` pour garantir un statut "En ligne" stable.\n- **Algorithme d\'achats :** Remplacement des données fictives de comparaison de fournisseurs par un algorithme d\'agrégation dynamique lisant `achats` et `details_achats`. Le système identifie désormais le "MEILLEUR" fournisseur en temps réel.';
fs.writeFileSync('auDit.md', audit);

let readme = fs.readFileSync('README.md', 'utf8');
if (!readme.includes('Comparateur de Fournisseurs Intelligent')) {
  readme += '\n\n## Fonctionnalités Avancées (Mise à jour)\n- **Comparateur de Fournisseurs Intelligent :** Lors d\'un réapprovisionnement, l\'application analyse l\'historique complet des achats et calcule le prix moyen ainsi que le dernier prix proposé par chaque fournisseur pour vous recommander le "MEILLEUR" prix automatiquement.';
  fs.writeFileSync('README.md', readme);
}

let idees = fs.readFileSync('nos_idees.md', 'utf8');
if (!idees.includes('Graphique d\'évolution des prix')) {
  idees += '\n\n### Améliorations Futures (Achats & IA)\n- **Graphique d\'évolution des prix :** Afficher une petite courbe (sparkline) montrant l\'inflation ou la baisse du prix d\'une pièce chez un fournisseur sélectionné au fil des mois.\n- **Alerte de marge :** Bloquer ou alerter le vendeur si le prix de vente saisi est inférieur au prix d\'achat moyen calculé dynamiquement.';
  fs.writeFileSync('nos_idees.md', idees);
}

console.log('Documentation mise à jour avec succès !');
