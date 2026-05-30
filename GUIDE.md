# GUIDE D'UTILISATION - AINA PIÈCE AUTO ERP

Ce guide est destiné à l'Administrateur pour la gestion quotidienne de l'ERP.
**URL :** https://aina-piece-auto.vercel.app

---

## 1. Création de Comptes et Gestion des Boutiques

### Créer un compte Caissier (Boutique)
1. Allez dans **Paramètres** > Onglet **Système, Sécurité & Personnalisation**.
2. Descendez à la section "Créer Automatiquement des Comptes Boutiques".
3. Remplissez l'email (ex: caisse.behoririka@aina.com) et le mot de passe.
4. **Très important :** Sélectionnez la boutique correspondante dans la liste déroulante.
5. Cliquez sur **Créer Compte Caissier**.

*Note : La liste déroulante se vide automatiquement après création pour éviter les doublons.*

### Matrice des Autorisations
1. Dans **Paramètres** > **Accès & Boutiques**, vous verrez la Matrice des Autorisations.
2. Cliquez sur l'icône œil pour masquer/afficher un module par boutique.
3. N'oubliez pas de cliquer sur le bouton bleu **ENREGISTRER**.

---

## 2. Impression Thermique Automatique (NOUVEAU)

### Activer l'impression automatique
1. Allez dans **Paramètres** > Onglet **Système, Sécurité & Personnalisation**.
2. Descendez à la section **Impression Thermique Automatique**.
3. Cliquez sur le bouton **Activer**.
4. Naviguez sur la page **Ventes** (rechargement nécessaire pour appliquer).

### Comportement
- **Imprimante thermique connectée :** Le ticket s'imprime automatiquement dès qu'une vente est validée.
- **Pas d'imprimante :** Le navigateur ouvre la boîte de dialogue d'impression standard avec l'option "Enregistrer en PDF".
- **Désactiver :** Retournez dans Paramètres → Système et cliquez **Désactiver**.

---

## 3. Le Mode Hors-Ligne (PWA)
Si vous perdez la connexion Internet (coupure JIRAMA ou autre) :
- L'application continue de fonctionner. **Ne fermez pas l'onglet.**
- Vous verrez une icône rouge (Nuage barré) indiquant le mode "Hors-Ligne".
- Vous pouvez continuer à enregistrer vos ventes (stockées dans la mémoire interne).
- Dès que la connexion revient, les ventes en attente se synchronisent automatiquement.

---

## 4. Réinitialisation du Système (Hard Reset)
1. Allez dans **Paramètres** > **Système**.
2. Cliquez sur **RÉINITIALISER** (bouton rouge).
3. Cochez les éléments à supprimer (Transactions, Catalogue, Utilisateurs, Boutiques).
4. Confirmez.

*Votre compte Administrateur (`ainapieces2026@gmail.com`) est "blindé" en dur. Vous ne pouvez jamais être supprimé lors d'une réinitialisation.*

---

## 5. Importation Excel
1. Accédez au module **Import Excel**.
2. Glissez-déposez votre fichier `.xlsx`.
3. Assurez-vous que votre fichier contient au minimum une colonne `REF` et `DESIGNATION`.
4. Si vous incluez une colonne `CODE_BARRE`, elle sera automatiquement reconnue.
5. Sélectionnez la boutique de destination (ou "Toutes les boutiques") et lancez.

---

## 6. Utilisation de la Douchette Code-barres
- **Partout dans l'application :** Branchez simplement votre douchette en USB.
- Pas besoin de cliquer dans une barre de recherche. L'ERP détecte automatiquement la douchette (vitesse de frappe) et ouvre instantanément la bonne fenêtre.
- Compatible AZERTY et QWERTY (traducteur intégré).

---

## 7. Exports de Rapports (PDF, Word, Excel)

### Les 3 formats sont identiques
Dans **Paramètres** > **Exporter Rapports**, les 3 boutons (Word, PDF, Excel) génèrent exactement les mêmes informations :
- **En-tête entreprise** : Nom, adresse, téléphone, NIF/STAT
- **Performance globale** : Chiffre d'affaires, Coûts achats, Charges, Bénéfice net, Articles vendus
- **Top 10 Produits** : Quantités, CA, Bénéfice estimé, Marge %
- **Alertes Stock Bas** : Articles sous le seuil minimum

**Excel spécifique :** En plus de la feuille "Analyse Globale" (miroir du PDF), vous obtenez des onglets détaillés Ventes, Achats, Dépenses, Stock.

---

## 8. Gestion des Crédits (Garages)

### Ventes à Crédit
- Lors d'une nouvelle vente, sélectionnez "VENTE À CRÉDIT" et choisissez le client.
- La transaction s'enregistre dans le tableau de vente avec un **fond rouge** si la dette est encore ouverte.
- La dette devient normale (même couleur que les autres ventes) quand toutes les dettes du client sont soldées.

### Encaisser un Règlement
1. Allez dans **Clients & Crédits**.
2. Cliquez sur **Encaisser** pour le client concerné.
3. Saisissez le montant reçu — le système affiche en temps réel :
   - **Reste à payer** (en rouge si > 0)
   - **Reste à rendre** (en vert si le client paie trop)
4. Cliquez **Valider l'encaissement**.
5. Le règlement apparaît dans la liste des ventes sous "Règlement Crédit - [Nom client]".

---

## 9. Surveillance en Temps Réel
Dans le **Tableau de bord** ou **Paramètres**, vous voyez l'état des boutiques (En Ligne, Récemment Actif, Hors Ligne). L'état s'actualise toutes les 60 secondes.

---

## 10. Gestion du Catalogue de Pièces

### Créer une nouvelle pièce
1. Allez dans **Pièces** > cliquez sur **+ Nouvelle pièce**.
2. Remplissez : Référence, Nom, Prix d'achat, Prix de vente.
3. Pour la **Boutique** :
   - **GLOBAL (Toutes les boutiques)** → quantité divisée équitablement. *Exemple : 40 unités / 2 boutiques = 20 par boutique.*
   - Ou choisissez une boutique spécifique.
4. Le **Prix de vente** saisi sera exactement le prix affiché lors d'une vente.

---

## 11. Procédure de Livraison au Nouveau Propriétaire

1. **Réinitialisation totale :** Paramètres > Réinitialiser (toutes les cases cochées).
2. **Recréer les boutiques :** Nom exact, adresse, téléphone.
3. **Recréer les comptes Caissiers :** Sélectionner OBLIGATOIREMENT la bonne boutique.
4. **Importer le catalogue** via Import Excel.
5. **Remettre le GUIDE.md** au propriétaire.
6. **Credentials Admin** : `ainapieces2026@gmail.com`.
