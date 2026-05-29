# NOS IDÉES — AINA PIÈCE AUTO ERP
> Fichier de collecte des idées futures et améliorations possibles
> Dernière mise à jour : **30/05/2026**

---

## 🚀 IDÉES PRIORITAIRES (À IMPLÉMENTER EN PREMIER)

### 1. Heartbeat Automatique des Boutiques (5 min)
**Problème :** Le témoin "En ligne" ne s'allume que si le caissier navigue activement.
**Solution :** Ajouter dans `Layout.tsx` un `setInterval` toutes les 5 minutes qui met à jour `last_login` :
```ts
const heartbeatInterval = setInterval(() => {
  supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', profile.id).then();
}, 5 * 60 * 1000); // 5 minutes
```
**Impact :** Témoin vert reste allumé tant que l'onglet est ouvert, même si l'utilisateur est inactif.

### 2. Contrainte UNIQUE sur code_barre
**Problème :** Deux pièces peuvent avoir le même code-barres. Le scanner prend la première trouvée.
**Solution SQL Supabase :**
```sql
ALTER TABLE pieces ADD CONSTRAINT pieces_code_barre_unique UNIQUE (code_barre);
```
**Avec gestion des nulls** (PostgreSQL ignore les NULLs dans les contraintes UNIQUE automatiquement).

### 3. Limite temporelle Dashboard (Performance)
**Problème :** Le dashboard charge TOUTES les ventes depuis le début → lenteur avec gros volume.
**Solution :** Limiter à 30/60 derniers jours par défaut :
```ts
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const { data: ventes } = await supabase.from('ventes')
  .select('...')
  .gte('created_at', thirtyDaysAgo.toISOString());
```

### 4. Notification Push Ventes en Temps Réel
Quand une boutique fait une vente, envoyer une notification à l'admin.
Technologies possibles : Web Push API + Service Worker (déjà en place PWA).

### 5. Graphique Ventes 7 Jours — Données Réelles
**Problème actuel :** Le graphique utilise des données aléatoires (`Math.random()`).
**Solution :** Remplacer par les vraies données depuis `rawData.ventes` groupées par jour.

---

## 💡 IDÉES MOYENNES (À PLANIFIER)

### 6. Export PDF Ticket
Permettre d'envoyer le ticket en PDF par WhatsApp ou Email directement depuis l'ERP.

### 7. Alerte Stock Bas par Notification
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
Appliquer une remise en % ou montant fixe sur une vente ou sur une pièce spécifique pendant une période.

---

## 🔮 IDÉES FUTURES (LONG TERME)

### 13. Application Mobile Native (React Native)
Convertir l'ERP en app mobile native pour accès hors navigateur.

### 14. IA — Prédiction de Réapprovisionnement
Analyser les historiques de ventes pour suggérer automatiquement quand commander et en quelle quantité.

### 15. Intégration SMS/WhatsApp pour Crédits
Envoyer automatiquement un rappel de dette au client/garage via SMS ou WhatsApp Business API.

### 16. Signature Électronique sur Factures
Pour les ventes à crédit importantes, faire signer le client via tablette/téléphone.

### 17. QR Code Client
Chaque garage partenaire a un QR code. Au scan, ouvre directement son compte crédit.

---

## ✅ IDÉES DÉJÀ IMPLÉMENTÉES (Archivées)

- ✅ Mode hors-ligne PWA + IndexedDB
- ✅ Scanner douchette universel AZERTY/QWERTY
- ✅ Ticket thermique dynamique par boutique
- ✅ Matrice permissions par boutique/page
- ✅ Hard Reset complet (incluant Clients & Crédits)
- ✅ Filtre ventes — exclut les crédits du tableau principal
- ✅ Dashboard avec filtre date locale (correction UTC+3 Madagascar)
- ✅ Import Excel massif avec déduplication
- ✅ Génération et impression étiquettes codes-barres
- ✅ Radar de présence boutiques (WebSocket Supabase)
- ✅ Export PDF/Word/Excel rapports multi-boutiques
- ✅ Verrouillage horaire boutique + alerte fermeture
- ✅ Mode simulation boutique pour admin
