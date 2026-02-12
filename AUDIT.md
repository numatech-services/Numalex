# NumaLex — Audit Technique Complet

**Date** : Février 2026  
**Périmètre** : 23 fichiers — ~2 984 lignes (TypeScript/TSX) + 390 lignes SQL  
**Verdict global** : Base architecturale solide, mais **7 problèmes critiques** à corriger avant toute mise en production.

---

## PARTIE 1 : PROBLÈMES IDENTIFIÉS

### 🔴 CRITIQUES (Bloquants — à corriger immédiatement)

| # | Fichier | Problème | Impact |
|---|---------|----------|--------|
| C1 | `lib/supabase/server.ts` | **API obsolète** — `createServerComponentClient` est déprécié depuis `@supabase/ssr` v0.1. Ne fonctionne pas correctement avec Next.js 14.1+. | App entière cassée |
| C2 | `lib/queries/matters.ts:53` | **Injection PostgREST** — La variable `search` est interpolée directement dans la chaîne `.or()` sans échappement. Un utilisateur peut injecter `%,id.eq.` pour manipuler les filtres. | Fuite de données inter-cabinet |
| C3 | `numalex_init.sql:198` | **`SECURITY DEFINER` sans `search_path`** — La fonction `get_my_cabinet_id()` est vulnérable au search_path hijacking. Un attaquant peut créer une fonction `auth.uid()` dans un schéma qu'il contrôle. | Escalade de privilèges DB |
| C4 | `lib/actions/auth.ts:197-229` | **Race condition à l'onboarding OTP** — Si deux requêtes concurrentes arrivent, deux cabinets sont créés. Pas de verrou ni de `ON CONFLICT`. | Données orphelines, profils dupliqués |
| C5 | `numalex_init.sql` | **Pas de policy INSERT sur `cabinets`** — La table a RLS activé mais aucune policy INSERT. L'onboarding OTP (qui crée un cabinet) échoue silencieusement côté client. | Inscription impossible par téléphone |
| C6 | `lib/actions/matters.ts:190` | **`redirect()` après `delete`** — `redirect()` de Next.js lance une exception `NEXT_REDIRECT`. Appelé dans un bloc qui retourne `UpsertMatterResult`, le type de retour est un mensonge au compilateur. Le client ne reçoit jamais la réponse. | Crash silencieux après suppression |
| C7 | `types/index.ts` | **Fichier `types/supabase.ts` manquant** — Importé dans `server.ts` (`import type { Database }`) mais jamais créé. Le build TypeScript échoue. | Build cassé |

### 🟡 SECONDAIRES (Non-bloquants — dette technique)

| # | Fichier | Problème |
|---|---------|----------|
| S1 | `matters-filters.tsx:61` | Pas de debounce sur l'input de recherche — chaque frappe déclenche une navigation serveur |
| S2 | `login-form.tsx` | 622 lignes dans un seul fichier — trop monolithique pour la maintenance |
| S3 | `matter-form.tsx` | Labels `<label>` non liés aux inputs via `htmlFor`/`id` — accessibilité WCAG 2.1 brisée |
| S4 | `numalex_init.sql` | Aucun index sur `invoices.due_at` — les requêtes de factures en retard seront lentes |
| S5 | Projet entier | Aucun `middleware.ts` — pas de protection de routes, l'URL `/dashboard` est accessible sans session |
| S6 | Projet entier | Aucun `layout.tsx` racine — pas de `<html>`, pas de `<meta>`, pas de police, pas de SEO |
| S7 | `page.tsx` (dossiers) | `searchParams` synchrone dans un Server Component — déprécié dans Next.js 15, à migrer vers `await` |
| S8 | `matters-table.tsx` | Dates formatées avec `Intl.DateTimeFormat('fr-NE')` — pas de fallback si le locale n'est pas supporté |

---

## PARTIE 2 : CORRECTIFS

Les correctifs sont fournis dans les fichiers joints. Voici le résumé.

### C1 : Migration vers `@supabase/ssr`
→ Voir `lib/supabase/server.ts` et nouveau `lib/supabase/client.ts`

### C2 : Sanitisation de la recherche PostgREST
→ Voir `lib/queries/matters.ts` — échappement des caractères spéciaux PostgREST

### C3 : Sécurisation de la fonction SQL
→ Voir `sql/001_security_fixes.sql` — ajout de `SET search_path = ''`

### C4 + C5 : Onboarding atomique + Policy INSERT cabinets
→ Voir `sql/001_security_fixes.sql` + `lib/actions/auth.ts` — transaction avec `ON CONFLICT`

### C6 : Correction du redirect après delete
→ Voir `lib/actions/matters.ts` — séparation redirect/retour

### C7 : Génération du type Database
→ Instructions + type stub dans `types/supabase.ts`

### S5 : Middleware d'authentification
→ Voir `middleware.ts`

### S6 : Layout racine
→ Voir `app/layout.tsx`

---

## PARTIE 3 : CHECKLIST PRÉ-DÉPLOIEMENT

### Infrastructure
- [ ] Variables d'environnement définies : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Exécuter `npx supabase gen types typescript` pour générer `types/supabase.ts`
- [ ] SMS Provider configuré dans Supabase (Twilio/MessageBird) pour l'OTP
- [ ] `sql/001_security_fixes.sql` exécuté dans l'éditeur SQL Supabase

### Sécurité
- [ ] Activer les security headers dans `next.config.js` (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting sur les Server Actions (via middleware ou Supabase edge function)
- [ ] Vérifier que `SUPABASE_SERVICE_ROLE_KEY` n'est JAMAIS exposé côté client
- [ ] Activer le MFA dans le dashboard Supabase pour les comptes admin

### Performance
- [ ] Images optimisées via `next/image`
- [ ] `next.config.js` avec `output: 'standalone'` pour les conteneurs
- [ ] Vérifier le bundle size avec `@next/bundle-analyzer`

### SEO & Accessibilité
- [ ] `robots.txt` et `sitemap.xml` (pages publiques uniquement)
- [ ] Open Graph meta tags sur les pages marketing
- [ ] Audit Lighthouse > 90 sur chaque catégorie
- [ ] Test clavier complet sur le formulaire de login et de dossiers

### Monitoring
- [ ] Error tracking (Sentry) configuré
- [ ] Analytics (Plausible/PostHog) pour le suivi d'usage
- [ ] Alertes Supabase sur les erreurs RLS et les quotas SMS
