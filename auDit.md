# AUDIT TECHNIQUE — AINA PIÈCE AUTO ERP
> Dernière mise à jour : **30/05/2026 — 00:50 (Madagascar, UTC+3)**

---

## ✅ POINT DE SAUVEGARDE CERTIFIÉ — 30/05/2026 00:50

**Hash Git actuel :** `6a8a6f6`
**URL Production :** https://aina-piece-auto.vercel.app
**Repository :** https://github.com/Aintsoa-ai/aina-piece-auto

---

## 🟢 FONCTIONNALITÉS VALIDÉES ET OPÉRATIONNELLES (30/05/2026)

### Module Ventes (Sales.tsx)
| Fonctionnalité | Statut | Note |
|---|---|---|
| Panier multi-articles | ✅ OK | Double panneau fonctionnel |
| Calcul total dynamique | ✅ OK | Temps réel |
| Encaissement avec rendu monnaie | ✅ OK | Modal intermédiaire |
| Ticket thermique | ✅ OK | **CORRIGÉ 30/05** — Boutique correcte figée |
| Scanner douchette (QWERTY/AZERTY) | ✅ OK | **CORRIGÉ 30/05** — Délai réduit 500ms→100ms |
| Ventes à crédit | ✅ OK | Filtrées hors tableau principal |
| Annulation vente (Admin) | ✅ OK | Remise stock automatique |
| Mode hors-ligne | ✅ OK | IndexedDB + syncUp |
| Filtre ventes — exclut CREDIT | ✅ OK | `.or('statut_paiement.neq.CREDIT,statut_paiement.is.null')` |

### Module Dashboard (Dashboard.tsx)
| Fonctionnalité | Statut | Note |
|---|---|---|
| Stats ventes du jour | ✅ OK | **CORRIGÉ 30/05** — Filtre UTC→Local (Madagascar +3h) |
| Realtime listener ventes | ✅ OK | `postgres_changes` sur table ventes |
| Calendrier activité | ✅ OK | Dates locales correctes |
| Filtre par date | ✅ OK | Conversion `toLocalDateStr()` |
| Stats stock global | ✅ OK | Données réelles Supabase |

### Module Clients & Crédits (Clients.tsx)
| Fonctionnalité | Statut | Note |
|---|---|---|
| Liste clients/garages | ✅ OK | Depuis table `clients` |
| Suivi dettes | ✅ OK | Calcul reste à payer |
| Encaissement partiel | ✅ OK | Via `reglements_credits` |
| Ventes crédit séparées | ✅ OK | Non mélangées avec ventes normales |

### Module Paramètres / Factory Reset (Settings.tsx)
| Fonctionnalité | Statut | Note |
|---|---|---|
| Purge historique (dates) | ✅ OK | Par plage de dates |
| Hard Reset — Ventes/Achats/Dépenses | ✅ OK | Table `ventes`, `achats`, `depenses` |
| Hard Reset — Clients/Crédits | ✅ OK | **AJOUTÉ 30/05** — Tables `clients` + `reglements_credits` |
| Hard Reset — Catalogue/Stock | ✅ OK | Tables `pieces`, `stock` |
| Hard Reset — Fournisseurs | ✅ OK | Table `fournisseurs` |
| Hard Reset — Numérotation | ✅ OK | Reset compteurs |
| Hard Reset — Boutiques | ✅ OK | Conserve boutique principale |
| Hard Reset — Utilisateurs | ✅ OK | Conserve admin |
| Texte checkbox mis à jour | ✅ OK | "Ventes, Achats, Dépenses, Mouvements et Clients/Crédits" |

### Témoin Présence Boutiques (Settings.tsx + Layout.tsx)
| Fonctionnalité | Statut | Note |
|---|---|---|
| Heartbeat `last_login` | ✅ OK | Update au chargement Layout |
| Canal Presence Supabase | ✅ OK | Channel `online-boutiques` |
| Détection instant online | ⚠️ PARTIEL | Fonctionne seulement si caissier actif dans l'onglet |
| Status "Hors ligne" | ⚠️ PRÉOCCUPANT | Affiché même si caissier connecté mais idle >2h |
| Refresh automatique | ✅ OK | Toutes les 60 secondes |

---

## 🔴 FAILLES ET BUGS IDENTIFIÉS (30/05/2026)

### 1. FAILLE CRITIQUE — Témoin présence boutiques toujours "Hors ligne"
**Fichier :** `src/pages/Settings.tsx` + `src/components/Layout.tsx`

**Symptôme :** Sur la capture d'écran, B TOAMASINA et B TANANARIVO affichent "Hors ligne" alors que les boutiques sont actives dans la matrice des autorisations (yeux verts).

**Cause racine :**
- Le canal Presence `online-boutiques` ne fonctionne que si le **caissier** est connecté et navigue activement
- L'admin connecté sur `boutique_id = null` track `'admin'`, pas les boutiques
- Si aucun caissier n'est connecté (ex: heure de fermeture), `isInstantlyOnline` est toujours `false`
- La fallback `last_login < 120 min` marque `'recent'` mais pas `'online'`

**Impact :** Visuellement trompeur. Le patron pense que les boutiques sont offline.

**Solution recommandée :** Augmenter le seuil `recent` à 30 min → `online`, ou ajouter un heartbeat périodique `last_login` dans Layout toutes les 5 minutes.

### 2. FAILLE MAJEURE — Dashboard affichait 0 Ar pour ventes du jour
**Fichier :** `src/pages/Dashboard.tsx` ligne 208
**Statut :** ✅ CORRIGÉ le 30/05/2026 (commit `6a8a6f6`)
**Cause :** Filtre comparait dates UTC vs dates locales Madagascar (+3h)
**Fix :** Fonction `toLocalDateStr()` — conversion `new Date(isoStr)` en date locale

### 3. FAILLE MAJEURE — Ticket thermique affichait mauvaise boutique
**Fichier :** `src/pages/Sales.tsx` lignes 531, 610, 666
**Statut :** ✅ CORRIGÉ le 30/05/2026 (commit `2eaec95`)
**Cause :** `boutiqueIdToUse = profile?.boutique_id || selectedBoutique` — l'admin Toamasina ignorait la sélection manuelle
**Fix :** Priorité inversée → `selectedBoutique || profile?.boutique_id` + `boutiqueNameToUse` résolu

### 4. FAILLE MAJEURE — Scanner douchette bloqué avec délai 500ms
**Fichier :** `src/pages/Sales.tsx` ligne 387
**Statut :** ✅ CORRIGÉ le 30/05/2026 (commit `2eaec95`)
**Cause :** Entre 2 chiffres du barcode, si le PC était lent, le buffer se réinitialisait
**Fix :** Délai réduit 500ms → 100ms

### 5. BUG — Ventes à crédit visibles dans tableau Ventes
**Fichier :** `src/pages/Sales.tsx` ligne 189
**Statut :** ✅ CORRIGÉ le 29/05/2026 (commit `261c0a3`)
**Fix :** Filtre `.or('statut_paiement.neq.CREDIT,statut_paiement.is.null')`

### 6. BUG — Hard Reset n'effaçait pas Clients & Crédits
**Fichier :** `src/pages/Settings.tsx`
**Statut :** ✅ CORRIGÉ le 30/05/2026 (commit `261c0a3`)
**Fix :** Ajout `reglements_credits` + `clients` dans `executeHardReset`

---

## ⚠️ POINTS FAIBLES IDENTIFIÉS (À SURVEILLER)

### Performance
- **Dashboard** : Charge TOUTES les ventes depuis le début (pas de limite temporelle). Avec des milliers de ventes, le chargement pourrait devenir lent.
- **fetchBoutiqueStatuses** : N requêtes Supabase pour N boutiques. Si beaucoup de boutiques, ralentissement notable.

### Sécurité
- **RLS** : Implémenté mais à vérifier régulièrement après les mises à jour.
- **Code barre dupliqué** : Aucune contrainte `UNIQUE` sur `code_barre` dans la table `pieces`. Deux pièces peuvent avoir le même code-barres.
- **Barcode buffer** : Le buffer de 100ms peut poser problème sur des machines très lentes. Si problème, remettre à 150ms.

### Mobile
- **Ticket thermique** : Sur mobile, `window.print()` ouvre parfois la mauvaise imprimante.
- **Scanner sur mobile** : Pas de support natif. Uniquement possible avec douchette Bluetooth.

### Cohérence des données
- **Stock négatif** : Possible si ventes hors-ligne désynchronisées dépassent le stock. Alertes prévues mais pas de blocage.
- **Prix de vente** : Calculé `prix_achat * 1.5` si absent. Peut créer des incohérences si prix_vente est null en base.

---

## 💪 POINTS FORTS CONFIRMÉS

1. **PWA + IndexedDB** — Fonctionne hors-ligne, sync automatique au retour réseau
2. **Multi-boutique sécurisé** — RLS Supabase, cloisonnement physique des données
3. **Realtime** — Présence WebSocket, dashboard temps réel
4. **Scanner universel** — QWERTY/AZERTY, 100ms de tolérance
5. **Ticket thermique** — CSS print natif, compatible 58mm et 80mm
6. **Import Excel** — Dédoublonnage, déploiement global, codes-barres
7. **Factory Reset** — Purge complète avec clés étrangères respectées
8. **Matrice permissions** — Contrôle granulaire par boutique/page
9. **Authentification sécurisée** — Admin blindé en dur, rôles stables

---

## 📋 HISTORIQUE DES POINTS DE SAUVEGARDE

| Date | Hash | Statut |
|---|---|---|
| 30/05/2026 00:50 | `6a8a6f6` | ✅ **STABLE** — Ventes, Dashboard, Scanner, Ticket, Crédits corrects |
| 29/05/2026 Nuit | `a97b286` | ✅ Stable — Ticket boutique + filtre crédits |
| 29/05/2026 15:00 | `88414da` | ✅ Stable — Documentation complète |
| 29/05/2026 | `8a46964` | ✅ Stable — Factory Reset étendu |
