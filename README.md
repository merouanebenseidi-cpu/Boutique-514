# Boutique 514

Boutique en ligne pour l'Algérie : produits en promotion (électronique, beauté, parfums, compléments, friandises…),
paiement à la livraison, site en français et en arabe, page admin pour gérer produits, commandes et tarifs de livraison.

## Ce que fait le site

**Côté clients** (`/fr` et `/ar`)
- Accueil avec les promotions du moment (prix barré + pourcentage de remise), catégories, tous les produits.
- Fiche produit, panier, commande sur une seule page : nom, téléphone (vérifié au format algérien), wilaya, commune,
  livraison à domicile ou au bureau du livreur, avec le prix de livraison selon la wilaya.
- Paiement à la livraison. CIB/Edahabia et « offrir depuis l'étranger » sont prévus mais désactivés (voir plus bas).

**Côté admin** (`/admin`, protégé par mot de passe)
- **Commandes** : liste filtrable par statut, fiche avec boutons Appeler / WhatsApp, changement de statut.
  Passer une commande en « Annulée » ou « Retour » remet les articles en stock.
- **Produits** : ajouter, modifier, masquer / afficher, mettre en avant, supprimer. Photo envoyée ou lien d'image.
- **Livraison** : tarifs domicile / bureau pour chaque wilaya, activer ou désactiver une wilaya, en ajouter une.

Le stock baisse automatiquement à chaque commande, et une commande qui dépasse le stock est refusée.

## Mise en ligne (une seule fois, ~20 minutes)

### 1. Base de données : Supabase (gratuit)
1. Crée un compte sur https://supabase.com puis **New project** (région : Europe, ex. Frankfurt).
   Note bien le mot de passe de la base.
2. Dans le projet : **Connect** (en haut) → **Connection string** → **Transaction pooler**. Copie l'adresse
   et remplace `[YOUR-PASSWORD]` par ton mot de passe : c'est ton `DATABASE_URL`.
3. **Project Settings → API** : copie l'**URL du projet** (`SUPABASE_URL`) et la clé **service_role**
   (`SUPABASE_SERVICE_ROLE_KEY`, à garder secrète). Elles servent à l'envoi des photos.

### 2. Créer les tables
**Le plus simple** : dans Supabase, ouvre **SQL Editor → New query**, colle tout le contenu du fichier
[`db/supabase-setup.sql`](db/supabase-setup.sql) et clique sur **Run**.

**Ou**, sur ton ordinateur (avec Node.js installé) :
```bash
npm install
cp .env.example .env.local   # puis remplis DATABASE_URL dans .env.local
npm run db:setup             # ou `npm run db:demo` pour ajouter 6 produits d'exemple
```
La commande crée les tables, les 58 wilayas avec des tarifs indicatifs et l'espace de stockage des photos.
On peut la relancer sans risque.

### 3. Hébergement : Vercel (gratuit)
1. Crée un compte sur https://vercel.com avec ton compte GitHub.
2. **Add New → Project** → importe le dépôt `Boutique-514`.
3. Dans **Environment Variables**, ajoute :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | l'adresse de l'étape 1.2 |
| `SUPABASE_URL` | étape 1.3 |
| `SUPABASE_SERVICE_ROLE_KEY` | étape 1.3 |
| `ADMIN_PASSWORD` | ton mot de passe admin (8 caractères minimum) |
| `ADMIN_SESSION_SECRET` | une longue suite de caractères au hasard (32+) |
| `NEXT_PUBLIC_SHOP_NAME` | `Boutique 514` (ou un autre nom) |
| `NEXT_PUBLIC_WHATSAPP` | ton numéro WhatsApp au format international, sans `+` (ex. `213555123456`) |

4. **Deploy**. Le site est en ligne à l'adresse donnée par Vercel ; l'admin est sur `/admin`.
   Un nom de domaine (ex. `boutique514.com`) peut être ajouté ensuite dans Vercel → Settings → Domains.

Chaque modification poussée sur la branche `main` redéploie le site automatiquement.

## Ajuster après la mise en ligne
- **Tarifs de livraison** : admin → Livraison. Ceux de départ sont indicatifs (Alger 400/300 DA, nord 600/400,
  hauts plateaux 800/500, sud 1000/700) : remplace-les par ceux de ton transporteur.
- **Catégories** : définies dans `lib/i18n.ts` (`CATEGORIES`).
- **Textes du site** (FR et AR) : `lib/i18n.ts`.

## Garder Supabase actif
Un projet Supabase gratuit se met en pause après une semaine sans activité. Sur Vercel, `vercel.json`
appelle chaque jour `/api/keepalive`, qui fait une petite requête à la base. Ajoute une variable
`CRON_SECRET` (suite de caractères au hasard) dans Vercel : seul Vercel pourra alors appeler cette adresse.

## Paiements en ligne (plus tard)
Le code est prêt à les recevoir : modes `cib_edahabia` et `card_intl`, champs « cadeau » (acheteur à l'étranger,
destinataire en Algérie) dans les commandes et le formulaire. Il reste à brancher les prestataires une fois les comptes ouverts :
- **CIB / Edahabia** via Chargily Pay : compte marchand vérifié (statut légal en Algérie requis).
- **Carte internationale** via Stripe pour « offrir depuis l'étranger » : compte Stripe dans ton pays de résidence.
  Avant d'activer cette option, vois avec un comptable comment rapatrier l'argent et déclarer ces ventes.

Points d'entrée : `lib/payments.ts` et le `TODO` de `app/(shop)/[lang]/panier/actions.ts`.

## Développement
```bash
npm run dev     # http://localhost:3000
npm run build
```
Next.js 16 (App Router), React 19, Tailwind CSS 4, PostgreSQL (Supabase) via `postgres`.
