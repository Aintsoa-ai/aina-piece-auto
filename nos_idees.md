# NOS IDÉES — AINA PIÈCE AUTO ERP
> Fichier de collecte des idées futures et améliorations possibles
> Dernière mise à jour : **31/05/2026**

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

## ✅ IDÉES DÉJÀ IMPLÉMENTÉES (Archivées)

- ✅ Mode hors-ligne PWA + IndexedDB
- ✅ Scanner douchette universel AZERTY/QWERTY (100ms)
- ✅ Ticket thermique dynamique par boutique
- ✅ Matrice permissions par boutique/page
- ✅ Hard Reset complet (incluant Clients & Crédits)
- ✅ Dashboard avec filtre date locale (correction UTC+3 Madagascar)
- ✅ Import Excel massif avec déduplication et option GLOBAL
- ✅ Génération et impression étiquettes codes-barres (50x30mm)
- ✅ Radar de présence boutiques (WebSocket Supabase + heartbeat 5min)
- ✅ Export PDF/Word/Excel rapports multi-boutiques **UNIFORMISÉS**
- ✅ Verrouillage horaire boutique + alerte fermeture 15min
- ✅ Mode simulation boutique pour admin
- ✅ Calcul encaissement (Espèces vs Total = Reste à rendre)
- ✅ Ventes à crédit avec module Clients & Crédits
- ✅ Règlements crédit → tableau de vente + code couleur en attente
- ✅ Calcul dynamique Reste à payer / Reste à rendre dans modal Encaisser
- ✅ **Impression thermique automatique** (localStorage toggle + fallback PDF)
