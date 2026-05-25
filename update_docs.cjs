const fs = require('fs');

// --- auDit.md ---
let audit = fs.readFileSync('auDit.md', 'utf8');
if (!audit.includes('25 Mai 2026')) {
  audit += `\n\n### AUDIT: 25 Mai 2026 - Remplacement des Calendriers et Messages Natifs\n`;
  audit += `- Vérification de l'interface des alertes : Tous les \`alert()\`, \`confirm()\` et \`prompt()\` ont été audités et remplacés par des modales professionnelles (SweetAlert2).\n`;
  audit += `- Vérification des calendriers : Le comportement natif bloquant a été retiré. Le module \`react-datepicker\` a été intégré avec succès sur toute la plateforme.\n`;
  audit += `- Vérification d'affichage : Test visuel validé pour l'apparition des "pastilles rouges" (jours d'activité) et "pastille bleue" (date du jour) directement dans les calendriers pop-up.\n`;
  audit += `- Statut du système : Parfaitement opérationnel et synchronisé avec Vercel.\n`;
  fs.writeFileSync('auDit.md', audit);
}

// --- nos_idees.md ---
let idees = fs.readFileSync('nos_idees.md', 'utf8');
if (!idees.includes('Sélection des plages de dates avec animation')) {
  idees += `\n\n### Améliorations Futures (Interface & UX)\n`;
  idees += `- **Calendriers Avancés :** Sélection des plages de dates avec animation de glissement.\n`;
  idees += `- **Thématisation :** Permettre aux utilisateurs de choisir la couleur d'accentuation (au lieu de seulement bleu/rouge).\n`;
  fs.writeFileSync('nos_idees.md', idees);
}

// --- plan.md ---
let plan = fs.readFileSync('plan.md', 'utf8');
if (!plan.includes('Phase 6')) {
  plan += `\n\n## Phase 6 : Optimisation de l'Expérience Utilisateur (En cours)\n`;
  plan += `- [x] Harmonisation de toutes les boîtes de dialogue (suppression des popups natifs bloquants).\n`;
  plan += `- [x] Standardisation du design des calendriers avec thématique sombre et indicateurs d'activité (pastilles rouges).\n`;
  plan += `- [ ] Revue complète de l'ergonomie sur mobile pour garantir que les claviers virtuels ne masquent plus aucune zone de saisie.\n`;
  fs.writeFileSync('plan.md', plan);
}

console.log('Fichiers mis à jour');
