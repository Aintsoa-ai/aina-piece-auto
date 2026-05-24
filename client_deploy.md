# Guide de Déploiement Nouveau Client - ERP Auto

## Pour chaque nouveau client, vous avez besoin de ~15 minutes.

---

## Étape 1 — Nouveau projet Supabase (5 min)

1. Allez sur https://supabase.com → **New Project**
2. Choisissez un nom (ex: `erp-auto-rakoto`)
3. Notez bien :
   - `Project URL` → ex: `https://abcdef.supabase.co`
   - `anon public key` → longue clé JWT

---

## Étape 2 — Initialiser la base de données (3 min)

Dans **SQL Editor → New Query** :

1. Exécutez `schema_initial.sql` → crée toutes les tables
2. Exécutez `supabase_rls_lock.sql` → active la sécurité

---

## Étape 3 — Configurer l'application (2 min)

Créez un fichier `.env` à la racine du projet :

```bash
VITE_SUPABASE_URL=https://VOTRE_PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique_ici
```

---

## Étape 4 — Déployer sur Vercel (5 min)

1. Allez sur https://vercel.com → **New Project**
2. Importez le repository GitHub
3. Dans **Environment Variables**, ajoutez :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Cliquez **Deploy** → URL unique générée automatiquement

---

## Étape 5 — Créer l'admin (2 min)

Dans **Supabase → Authentication → Users** :
1. **Invite user** → email de l'administrateur
2. Dans **SQL Editor**, assignez le rôle admin :

```sql
-- Remplacez l'UUID par celui de l'utilisateur créé
UPDATE public.profiles 
SET role_id = (SELECT id FROM public.roles WHERE name = 'administrateur')
WHERE email = 'admin@clientx.com';
```

---

## Résultat

| Élément | Valeur |
|---|---|
| URL app | `https://erp-rakoto.vercel.app` |
| Base de données | Supabase isolé (données 100% séparées) |
| Sécurité | RLS activé |
| Temps de setup | ~15 minutes |

---

## Fichiers nécessaires (à conserver précieusement)

```
📁 Votre dossier de travail/
├── schema_initial.sql     ← Crée la base vierge
├── supabase_rls_lock.sql  ← Active la sécurité RLS
└── client_deploy.md       ← Ce guide
```
