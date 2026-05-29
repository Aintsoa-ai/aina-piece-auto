# GUIDE D'UTILISATION - AINA PIÈCE AUTO ERP

Ce guide est destiné à l'Administrateur pour la gestion quotidienne de l'ERP.

## 1. Création de Comptes et Gestion des Boutiques
### Créer un compte Caissier (Boutique)
1. Allez dans le module **Paramètres** > Onglet **Système, Sécurité & Personnalisation**.
2. Descendez à la section "Créer Automatiquement des Comptes Boutiques".
3. Remplissez l'email (ex: caisse.behoririka@aina.com) et le mot de passe.
4. **Très important :** Sélectionnez la boutique correspondante dans la liste déroulante.
5. Cliquez sur **Créer Compte Caissier**.
*Note : Après création, la liste déroulante se vide automatiquement pour éviter de rattacher le prochain compte à la même boutique par erreur.*

### Matrice des Autorisations
1. Dans **Paramètres** > **Accès & Boutiques**, vous verrez la Matrice des Autorisations.
2. Cette matrice liste les profils (utilisateurs) et les boutiques.
3. Cliquez sur l'icône de l'œil pour masquer ou afficher un module (Ventes, Achats, etc.) pour une boutique ou un utilisateur spécifique.
4. N'oubliez pas de cliquer sur le bouton bleu **ENREGISTRER** en haut à droite.

## 2. Le Mode Hors-Ligne (PWA)
Si vous perdez la connexion Internet (coupure JIRAMA ou autre) :
- L'application continue de fonctionner. Ne fermez pas l'onglet.
- Vous verrez une icône rouge (Nuage barré) en bas à gauche indiquant le mode "Hors-Ligne".
- Vous pouvez continuer à enregistrer vos ventes. Elles seront stockées dans la mémoire interne de l'appareil (IndexedDB).
- Dès que la connexion revient, les ventes en attente seront synchronisées automatiquement.

## 3. Réinitialisation du Système (Hard Reset)
Si vous devez nettoyer la base de données (par exemple après des tests) :
1. Allez dans **Paramètres** > **Système**.
2. Cliquez sur **RÉINITIALISER** (bouton rouge).
3. Cochez les éléments à supprimer (Transactions, Catalogue, Utilisateurs, Boutiques).
4. Confirmez. 
*Note de sécurité : Votre compte Administrateur (ainapieces2026@gmail.com) est "blindé" dans le code. Vous ne pourrez jamais perdre vos droits ou être supprimé par erreur lors d'une réinitialisation.*

## 4. Importation Excel
1. Accédez au module **Import Excel**.
2. Glissez-déposez votre fichier `.xlsx`.
3. Assurez-vous que votre fichier contient au minimum une colonne `REF` et `DESIGNATION`.
4. Si vous incluez une colonne `CODE_BARRE`, elle sera automatiquement reconnue pour la douchette.
5. Sélectionnez la boutique de destination (ou "Toutes les boutiques") et lancez l'importation.

## 5. Utilisation de la Douchette Code-barres
- **Partout dans l'application :** Branchez simplement votre douchette en USB.
- Vous n'avez pas besoin de cliquer dans une barre de recherche. L'ERP détecte automatiquement qu'une douchette a été utilisée (grâce à sa vitesse de frappe) et ouvre instantanément la fenêtre de Vente, d'Achat, ou d'Inventaire selon la page où vous êtes.

## 6. Surveillance en Temps Réel
Dans le **Tableau de bord** ou dans les **Paramètres**, vous pouvez voir l'état des boutiques (En Ligne, Récemment Actif, Hors Ligne). L'état s'actualise toutes les 60 secondes pour vous indiquer qui est actuellement devant sa caisse.

## 7. Gestion du Catalogue de Pièces

### Créer une nouvelle pièce
1. Allez dans **Pièces** > cliquez sur **+ Nouvelle pièce**.
2. Remplissez : Référence, Nom de la pièce, Prix d'achat, Prix de vente.
3. Pour la **Boutique** :
   - Choisissez **GLOBAL (Toutes les boutiques)** → la quantité sera divisée équitablement.
     *Exemple : 40 unités / 2 boutiques = 20 par boutique. Total affiché = 40.*
   - Ou choisissez une boutique spécifique → la quantité totale va à cette boutique uniquement.
4. Le **Prix de vente** saisi sera exactement le prix affiché lors d'une nouvelle vente.

### Modifier une pièce existante
1. Cliquez sur le bouton **✏️ crayon** en face de la pièce.
2. La boutique est pré-sélectionnée sur **GLOBAL** par défaut.
3. Si vous changez la quantité en mode GLOBAL, elle sera redistribuée entre les boutiques.
4. Cliquez **Enregistrer** — les prix sont sauvegardés immédiatement en base de données.

> **Important :** Le prix affiché dans "Nouvelle Vente" = le prix saisi dans le catalogue.
> Ne modifiez pas le prix achat/vente après une vente, sinon les bénéfices historiques seront incorrects.

## 8. Procédure de Livraison au Nouveau Propriétaire

1. **Réinitialisation totale :** Paramètres > Réinitialiser (toutes les cases cochées).
2. **Recréer les boutiques :** Nom exact, adresse, téléphone.
3. **Recréer les comptes Caissiers :** Sélectionner OBLIGATOIREMENT la bonne boutique.
4. **Importer le catalogue** via Import Excel.
5. **Remettre le GUIDE.md** au propriétaire.
6. **Credentials Admin** à transmettre en sécurité : `ainapieces2026@gmail.com`.
