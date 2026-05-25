import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.join(__dirname, 'src', 'pages', 'Settings.tsx');
let content = fs.readFileSync(settingsPath, 'utf8');

content = content.replace(
  "import React, { useState, useEffect, useMemo, useRef } from 'react';",
  "import React, { useState, useEffect, useMemo, useRef } from 'react';\nimport { showAlert, showConfirm, showPrompt } from '../utils/alerts';"
);

// handleBackup alerts
content = content.replace(
  "alert(`✅ Point de sauvegarde généré ET envoyé automatiquement avec succès à ${backupEmail} !\\n\\nImportant : Si c'est la TOUTE PREMIÈRE FOIS, veuillez consulter votre boîte de réception (ou dossier Spam) pour valider l'adresse email auprès du service d'envoi.`);",
  "showAlert(`✅ Point de sauvegarde généré ET envoyé automatiquement avec succès à ${backupEmail} !\\n\\nImportant : Si c'est la TOUTE PREMIÈRE FOIS, veuillez consulter votre boîte de réception (ou dossier Spam) pour valider l'adresse email auprès du service d'envoi.`, 'success');"
);

content = content.replace(
  'alert("La sauvegarde a été téléchargée sur l\'ordinateur, mais l\'envoi automatique par email a échoué. Vérifiez votre connexion internet.");',
  'showAlert("La sauvegarde a été téléchargée sur l\'ordinateur, mais l\'envoi automatique par email a échoué. Vérifiez votre connexion internet.", "warning");'
);

content = content.replace(
  'alert("Point de sauvegarde téléchargé avec succès sur l\'ordinateur ! (Aucun email de sécurité défini)");',
  'showAlert("Point de sauvegarde téléchargé avec succès sur l\'ordinateur ! (Aucun email de sécurité défini)", "success");'
);

content = content.replace(
  'alert("Erreur de sauvegarde: " + err.message);',
  'showAlert("Erreur de sauvegarde: " + err.message, "error");'
);

// handleImportBackup
content = content.replace(
  "if (window.confirm(`⚠️ RESTAURATION DU POINT DE SAUVEGARDE ⚠️\\n\\nVoulez-vous restaurer l'état du système du ${new Date(data.timestamp).toLocaleString('fr-FR')} ?\\n\\nCela écrasera la base de données actuelle pour y injecter les anciennes valeurs.`)) {",
  "const confirmed = await showConfirm(`⚠️ RESTAURATION DU POINT DE SAUVEGARDE ⚠️\\n\\nVoulez-vous restaurer l'état du système du ${new Date(data.timestamp).toLocaleString('fr-FR')} ?\\n\\nCela écrasera la base de données actuelle pour y injecter les anciennes valeurs.`, true);\n        if (confirmed) {"
);

content = content.replace(
  'alert("Point de sauvegarde chargé ! L\'application va traiter les données...");',
  'showAlert("Point de sauvegarde chargé ! L\'application va traiter les données...", "info");'
);

content = content.replace(
  'alert("Erreur d\'importation : " + err.message);',
  'showAlert("Erreur d\'importation : " + err.message, "error");'
);

// saveBoutiqueSettings
content = content.replace(
  'alert("Informations de la boutique sauvegardées localement avec succès !");',
  'showAlert("Informations de la boutique sauvegardées localement avec succès !", "success");'
);

content = content.replace(
  'alert("Erreur lors de la sauvegarde.");',
  'showAlert("Erreur lors de la sauvegarde.", "error");'
);

// File size warning
content = content.replace(
  'alert("L\'image est trop volumineuse (Max 1MB).");',
  'showAlert("L\'image est trop volumineuse (Max 1MB).", "warning");'
);

// executeExport
content = content.replace(
  'alert("Veuillez autoriser les fenêtres contextuelles (pop-ups) pour imprimer en PDF.");',
  'showAlert("Veuillez autoriser les fenêtres contextuelles (pop-ups) pour imprimer en PDF.", "warning");'
);

content = content.replace(
  'alert("Veuillez autoriser les fenêtres contextuelles (pop-ups) pour imprimer.");',
  'showAlert("Veuillez autoriser les fenêtres contextuelles (pop-ups) pour imprimer.", "warning");'
);

content = content.replace(
  'alert("Erreur lors de l\'export: " + err.message);',
  'showAlert("Erreur lors de l\'export: " + err.message, "error");'
);

// executePurge
content = content.replace(
  "if (!window.confirm(`⚠️ ATTENTION ⚠️\\n\\nVous êtes sur le point d'EFFACER DÉFINITIVEMENT toutes les transactions (Ventes, Achats, Dépenses) du ${purgeStart} au ${purgeEnd}.\\n\\nCette action est totalement IRRÉVERSIBLE et permet de libérer de l'espace dans la base de données.\\nÊtes-vous absolument certain(e) de vouloir continuer ?`)) {",
  "const confirmed = await showConfirm(`⚠️ ATTENTION ⚠️\\n\\nVous êtes sur le point d'EFFACER DÉFINITIVEMENT toutes les transactions (Ventes, Achats, Dépenses) du ${purgeStart} au ${purgeEnd}.\\n\\nCette action est totalement IRRÉVERSIBLE et permet de libérer de l'espace dans la base de données.\\nÊtes-vous absolument certain(e) de vouloir continuer ?`, true);\n    if (!confirmed) {"
);

content = content.replace(
  "alert(`✅ Purge effectuée avec succès.\\nLes données de la période ${purgeStart} au ${purgeEnd} ont été effacées.`);",
  "showAlert(`✅ Purge effectuée avec succès.\\nLes données de la période ${purgeStart} au ${purgeEnd} ont été effacées.`, 'success');"
);

content = content.replace(
  'alert("❌ Erreur lors de la purge: " + err.message);',
  'showAlert("❌ Erreur lors de la purge: " + err.message, "error");'
);

// prompt
content = content.replace(
  "onClick={() => {\n                                const newPwd = prompt(",
  "onClick={async () => {\n                                const newPwd = await showPrompt("
);

fs.writeFileSync(settingsPath, content);
console.log('Settings.tsx replacements done.');
