# NumaLex — SaaS Juridique pour le Niger (Zone OHADA)

Plateforme de gestion juridique multi-tenant pour avocats, notaires et commissaires de justice au Niger.

## Stack technique

- **Frontend** : Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend** : Server Actions, Supabase (PostgreSQL + Auth + Storage)
- **Sécurité** : RLS multi-tenant, RBAC 5 niveaux, 2FA, CSP, rate limiting
- **IA** : Assistant Claude (optionnel)

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env.local
# Remplir les valeurs dans .env.local

# 3. Exécuter les migrations SQL (dans Supabase SQL Editor)
# sql/000_init.sql → 006_robustness.sql (dans l'ordre)

# 4. Créer les utilisateurs de test
npm run seed

# 5. Lancer le serveur
npm run dev
```

## Comptes de test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@numalex.ne | NumaLex2026! | Admin / Avocat |
| notaire@numalex.ne | Notaire2026! | Admin / Notaire |
| huissier@numalex.ne | Huissier2026! | Admin / Huissier |
| client@test.ne | Client2026! | Portail client |

## Architecture

```
numalex/
├── app/                    # Routes Next.js (App Router)
│   ├── dashboard/          # Espace professionnel (11 modules)
│   ├── client/             # Portail client (lecture seule)
│   ├── auth/               # Callback auth
│   └── api/health/         # Healthcheck
├── components/             # Composants React
├── lib/
│   ├── actions/            # Server Actions (13 fichiers)
│   ├── repositories/       # Couche d'accès données
│   ├── validations.ts      # Schémas Zod (12 schémas)
│   ├── security.ts         # Rate limiting, logger, sanitize
│   └── env.ts              # Validation variables env
├── sql/                    # Migrations PostgreSQL (7 fichiers)
├── scripts/                # check-env, seed-users
└── docs/                   # Documentation audit
```

## Modules

| Module | Profession | Description |
|--------|-----------|-------------|
| Dashboard | Tous | 6 KPIs + 6 widgets temps réel |
| Dossiers | Tous | CRUD avec tags, collaborateurs, notes privées |
| Clients | Tous | CRM clients physiques/moraux |
| Agenda | Tous | 11 types d'événements juridiques |
| Factures | Tous | Facturation XOF + multi-paiements (mobile money) |
| Documents | Tous | GED avec versioning et hash SHA-256 |
| Suivi temps | Avocat | Time tracking avec calcul honoraires |
| Actes | Notaire | Registre des actes notariés OHADA |
| PV & Constats | Huissier | Constats avec GPS et signification |
| Assistant IA | Tous | Résumé, courrier, checklist, suggestions |
| Portail client | Clients | Accès lecture seule dossiers/factures/documents |

## Sécurité

- **Multi-tenant** : `cabinet_id` + RLS sur 15+ tables
- **RBAC** : 5 rôles (admin, associé, collaborateur, secrétariat, lecture) + 20 permissions fines
- **Auth** : JWT Supabase, refresh automatique, 2FA TOTP ready
- **Headers** : CSP, HSTS, X-Frame-Options, CORP, COOP, XSS Protection
- **Rate limiting** : 10 req/min sur login, configurable par catégorie
- **Audit** : Log immutable sur 10 tables, IP tracking
- **Soft delete** : Aucune donnée jamais supprimée physiquement
- **Validation** : Zod côté serveur sur toutes les entrées

## Déploiement production

```bash
# 1. Vérifier la configuration
npm run check-env

# 2. Build
npm run build

# 3. Démarrer
npm start
```

### Variables requises

| Variable | Obligatoire | Description |
|----------|------------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ | URL du projet Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ | Clé anonyme Supabase |
| ANTHROPIC_API_KEY | ❌ | Clé API Claude (IA) |
| SUPABASE_SERVICE_ROLE_KEY | ❌ | Pour scripts admin |

### Checklist pré-déploiement

- [ ] Variables d'environnement validées (`npm run check-env`)
- [ ] Migrations SQL exécutées (000 → 006)
- [ ] Build sans erreur (`npm run build`)
- [ ] Healthcheck OK (`GET /api/health`)
- [ ] Backup configuré (voir BACKUP.md)
- [ ] HTTPS activé
- [ ] DNS configuré

## Procédure incident

1. Vérifier `/api/health` — identifie app, DB, env
2. Consulter les logs serveur (JSON structuré)
3. Si DB down → vérifier Supabase Dashboard
4. Si données corrompues → restaurer depuis backup (voir BACKUP.md)
5. Si faille sécurité → révoquer les sessions (`revoked_sessions`) + forcer logout

## Rollback

```bash
# Revenir à la version précédente
git checkout <commit-précédent>
npm install && npm run build && npm start

# Rollback DB (si migration destructive)
# Restaurer depuis le dernier backup
pg_restore --clean --dbname=$DATABASE_URL backup.dump
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production (vérifie env) |
| `npm run check-env` | Valide les variables d'environnement |
| `npm run seed` | Crée les utilisateurs de test |
| `npm run type-check` | Vérification TypeScript |
| `npm run lint` | ESLint |

## Licence

Usage interne — NumaLex.
