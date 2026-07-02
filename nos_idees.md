# NOS IDÉES — AINA PIÈCE AUTO ERP & AGENDA INTELLIGENT
> Fichier de collecte des idées futures et améliorations possibles
> Dernière mise à jour : **14/06/2026**

---

## 🟢 POINTS FORTS ET FAIBLESSES

### 💪 Points Forts du Système
1. **PWA & IndexedDB** : Fonctionne hors-ligne avec synchronisation automatique au retour du réseau.
2. **Scanner Universel** : Adaptabilité (100ms) pour lecteurs QWERTY/AZERTY, tolérance aux erreurs.
3. **Multi-boutique Sécurisé** : Isolation absolue via RLS Supabase (sécurité invisible en DB).
4. **Ticket Thermique Dynamique** : Impression automatique `window.print()` adaptable 58/80mm sans popup supplémentaire.
5. **Fiabilité Catalogue** : Résolution EAN-13 déterministe pour recherche unifiée et impression.
6. **Exports Multi-supports** : Structure commune (PDF = Word = Excel) avec graphiques SVG, KPI et tableaux sans perte d'info.

### ⚠️ Points Faibles / Failles (ERP Web)
1. **Performance Dashboard** : Actuellement sans limite temporelle.
2. **Absence d'unicité `code_barre`** : Deux pièces peuvent encore théoriquement partager un code-barres.
3. **Stock Négatif Hors-Ligne** : Possible si plusieurs terminaux vendent la même pièce déconnectée.
4. **Rechargement pour Options** : Certaines options demandent d'actualiser la page.

### 💪 Points Forts (Agenda Intelligent Mobile)
1. **Intelligence Linguistique Hybride :** Moteur phonétique (Français + Malgache) avec prosodie naturelle, et détection fine des voix Premium.
2. **Auto-Adaptation Temporelle :** Interface qui change d'elle-même (Jour/Nuit) selon l'heure, et salutations dynamiques (Bonjour/Bonsoir).
3. **Souveraineté des Données :** 100% Hors-Ligne, aucune dépendance cloud.
4. **Calcul Astronomique :** Jours fériés calculés sans API.
5. **Accessibilité & UX "Magique" :** Sous-titres dynamiques synchronisés avec la voix, lecture automatique au toucher, et modification des tâches sans suppression.

### ⚠️ Points Faibles (Agenda Intelligent Mobile)
1. **Limitation d'Ouverture Auto :** OS Mobile interdit d'ouvrir l'app sans l'action utilisateur (Nécessite Full-Screen Intents).
2. **Dépendance Moteur Vocal OS :** La qualité de la voix dépend de Google TTS / Apple Siri.
3. **Scalabilité AsyncStorage :** Après des années, SQLite sera préférable.

---

## 🚀 IDÉES PRIORITAIRES (À IMPLÉMENTER EN PREMIER)

### 1. Contrainte UNIQUE sur code_barre
**Problème :** Deux pièces peuvent avoir le même code-barres. Le scanner prend la première trouvée.
**Solution SQL Supabase :**
```sql
ALTER TABLE pieces ADD CONSTRAINT pieces_code_barre_unique UNIQUE (code_barre);
```
**Avec gestion des nulls** (PostgreSQL ignore les NULLs dans les contraintes UNIQUE automatiquement).

### 2. Limite temporelle Dashboard (Performance)
**Problème :** Le dashboard charge TOUTES les ventes depuis le début → lenteur avec gros volume.
**Solution :** Limiter à 30/60 derniers jours par défaut :
```ts
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const { data: ventes } = await supabase.from('ventes')
  .select('...')
  .gte('created_at', thirtyDaysAgo.toISOString());
```

### 3. Notification Push Ventes en Temps Réel
Quand une boutique fait une vente, envoyer une notification à l'admin.
Technologies possibles : Web Push API + Service Worker (déjà en place PWA).

### 4. Graphique Ventes 7 Jours — Données Réelles
**Problème actuel :** Le graphique utilise des données aléatoires (`Math.random()`).
**Solution :** Remplacer par les vraies données depuis `rawData.ventes` groupées par jour.

### 5. Toggle Impression Thermique Auto Réactif
**Actuel :** Le toggle dans Paramètres → Système nécessite de recharger la page Ventes pour appliquer.
**Amélioration :** Écouter l'événement `storage` dans `Sales.tsx` pour mettre à jour `autoPrintEnabled` sans rechargement de page :
```ts
useEffect(() => {
  const handler = () => setAutoPrintEnabled(localStorage.getItem('auto_print_thermal') === 'true');
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}, []);
```

---

## 💡 IDÉES MOYENNES (À PLANIFIER)

### 6. Export PDF Ticket par Email / WhatsApp
Permettre d'envoyer le ticket en PDF par WhatsApp ou Email directement depuis l'ERP.

### 7. Alerte Stock Bas par Notification Push
Quand une pièce atteint le seuil minimum, envoyer une alerte push à l'admin.

### 8. Historique des Prix d'Achat par Pièce
Tracer l'évolution du prix d'achat au fil du temps pour chaque référence.
La base est prête (`price_history` dans `piece_fournisseurs`).

### 9. Module Devis / Facture Pro
Générer une facture professionnelle avec en-tête boutique, numéro fiscal, pour les clients garages.

### 10. Code-barres sur Mobile (Caméra)
Utiliser la caméra du téléphone pour scanner les codes-barres sans douchette physique.
Bibliothèques possibles : `zxing-js`, `html5-qrcode`.

### 11. Tableau de Bord Admin Multi-Boutique Consolidé
Comparer les performances de B TOAMASINA vs B TANANARIVO côte à côte.
- Ventes par boutique ce mois
- Stock critique par boutique
- Employé le plus actif

### 12. Système de Promotion / Remise Globale
Appliquer une remise en % ou montant fixe sur une vente ou une pièce spécifique pendant une période.

### 13. Détection Automatique Modèle Imprimante
Détecter automatiquement si l'imprimante thermique connectée est 58mm ou 80mm et ajuster le CSS print en conséquence via une API Bluetooth/USB (Web Serial API).

### 14. Paiement Partiel sur Crédit à la Vente
Actuellement, lors d'une vente à crédit, `montant_paye` = 0. Permettre au caissier de saisir un acompte (ex: payer 50% immédiatement) au moment de la vente.

---

## 🔮 IDÉES FUTURES (LONG TERME)

### 15. Application Mobile Native (React Native)
Convertir l'ERP en app mobile native pour accès hors navigateur.

### 16. IA — Prédiction de Réapprovisionnement
Analyser les historiques de ventes pour suggérer automatiquement quand commander et en quelle quantité.

### 17. Intégration SMS/WhatsApp pour Crédits
Envoyer automatiquement un rappel de dette au client/garage via SMS ou WhatsApp Business API.

### 18. Signature Électronique sur Factures
Pour les ventes à crédit importantes, faire signer le client via tablette/téléphone.

### 19. QR Code Client
Chaque garage partenaire a un QR code. Au scan, ouvre directement son compte crédit.

### 20. SaaS Multi-Client
Créer une page de démonstration publique (avec fausses données) + grille tarifaire (forfait installation + abonnement mensuel).

---

## 🚀 CE QUI RESTE À ACCOMPLIR (TO DO)

### A. Concernant l'ERP Web
1. Contrainte UNIQUE sur `code_barre` dans Supabase.
2. Limiter le Dashboard à 30/60 jours pour les performances.
3. Notification Push Ventes en Temps Réel.
4. Toggle Impression Thermique Auto Réactif (Écouter `storage`).
5. Graphique Ventes 7 Jours — Données Réelles.
6. Export PDF Ticket par Email / WhatsApp.
7. Alerte Stock Bas par Notification Push.
8. Module Devis / Facture Pro.
9. Code-barres sur Mobile (Caméra).
10. Détection Automatique Modèle Imprimante.

### B. Concernant l'Agenda Intelligent Mobile
1. **Migration SQLite** : Remplacer AsyncStorage par `expo-sqlite` pour la pérennité.
2. **Full-Screen Alarm Intents** : Utiliser `Notifee` pour réveiller le téléphone à l'heure du réveil au lieu des notifications simples.
3. **Sécurité Biométrique** : Ajouter l'empreinte digitale pour sécuriser les finances de l'agenda.
4. **Export de sauvegarde locale** : Créer un JSON crypté téléchargeable.
5. **Mode "Ne pas déranger" global** : Couper les alarmes pendant la plage horaire de "sommeil".

---

## ✅ IDÉES DÉJÀ FAITES (DONE)

- ✅ Mode hors-ligne PWA + IndexedDB
- ✅ Scanner douchette universel AZERTY/QWERTY (100ms)
- ✅ Ticket thermique dynamique par boutique
- ✅ Matrice permissions par boutique/page
- ✅ Hard Reset complet (incluant Clients & Crédits)
- ✅ Dashboard avec filtre date locale (correction UTC+3 Madagascar)
- ✅ Import Excel massif avec déduplication et option GLOBAL
- ✅ Génération et impression étiquettes EAN-13 déterministes (5cm x 3cm) sans prix
- ✅ Scanner douchette compatible EAN-13 déterministe sur tous les modules (Ventes, Stock, Achats, Pièces)
- ✅ Radar de présence boutiques (WebSocket Supabase + heartbeat 5min)
- ✅ Export PDF/Word/Excel rapports multi-boutiques **UNIFORMISÉS**
- ✅ Verrouillage horaire boutique + alerte fermeture 15min
- ✅ Mode simulation boutique pour admin
- ✅ Calcul encaissement (Espèces vs Total = Reste à rendre)
- ✅ Ventes à crédit avec module Clients & Crédits
- ✅ Règlements crédit → tableau de vente + code couleur en attente
- ✅ Calcul dynamique Reste à payer / Reste à rendre dans modal Encaisser
- ✅ **Impression thermique automatique** (localStorage toggle + fallback PDF)
- ✅ **Affichage Date d'Arrivage** à la place de Catégorie (13/06/2026)
- ✅ **Filtre de recherche insensible à la casse** sur tout le catalogue (13/06/2026)
- ✅ **Correction Stock ciblé** sur la modification des pièces (13/06/2026)
- ✅ **Correction Base vierge** : plus de lieu vide ou quantité 0 lors de l'initialisation (13/06/2026)
- ✅ **Pagination Supabase (fetchAll)** : contournement de la limite des 1000 lignes pour charger la totalité du stock (13/06/2026)
- ✅ **Agenda Intelligent (Nouveau Projet)** : Création complète de l'application React Native 100% hors-ligne.
- ✅ **Moteur Phonétique Humanisé** : La voix parle le malgache et le français avec fluidité sans le défaut des terminaisons en "-ment".
- ✅ **Thème Auto-Adaptatif** : Jour/Nuit dynamique basé sur l'horloge système.
- ✅ **Personnalisation de l'IA (Bi-genrée)** : Noms séparés pour la femme et l'homme. Ciblage natif des identifiants Google TTS (fr-fr-x-frd) pour garantir une vraie voix masculine.
- ✅ **Lecture Vocale Intuitive** : L'IA lit automatiquement le résumé lorsqu'on touche une date.
- ✅ **Gestion du Silence** : Bouton Mute intelligent (icône Haut-Parleur vert/rouge).
- ✅ **Sous-Titres (Closed Captioning)** : Bulle de dialogue affichant ce que l'IA prononce en temps réel.
- ✅ **Salutation Contextuelle** : Bonjour ou Bonsoir dynamiquement calculé selon l'heure (seuil 18h).
- ✅ **Édition des Tâches** : Modification des tâches et reprogrammation des alarmes à la volée.
