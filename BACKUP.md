# NumaLex — Sauvegarde & Restauration

## Stratégie de sauvegarde

### 1. Base de données (PostgreSQL via Supabase)

#### Sauvegardes automatiques Supabase
- **Plan Pro** : sauvegardes quotidiennes automatiques, rétention 7 jours
- **Plan Enterprise** : Point-in-Time Recovery (PITR) jusqu'à 7 jours

#### Sauvegarde manuelle (recommandé : hebdomadaire)

```bash
# Via Supabase CLI
supabase db dump --project-ref $PROJECT_ID > backup_$(date +%Y%m%d).sql

# Via pg_dump direct
pg_dump $DATABASE_URL \
  --format=custom \
  --no-owner \
  --no-acl \
  --file=numalex_$(date +%Y%m%d).dump
```

#### Restauration

```bash
# Depuis un dump custom
pg_restore --clean --if-exists --dbname=$DATABASE_URL numalex_20260211.dump

# Depuis un dump SQL
psql $DATABASE_URL < backup_20260211.sql
```

### 2. Documents (Supabase Storage)

```bash
# Lister les fichiers du bucket
supabase storage ls documents --project-ref $PROJECT_ID

# Télécharger tout le bucket
mkdir -p backup_storage
supabase storage cp -r documents/ ./backup_storage/ --project-ref $PROJECT_ID
```

**Alternative S3/MinIO :** Si vous utilisez un stockage S3 compatible, utilisez `aws s3 sync`.

### 3. Configuration

Fichiers à sauvegarder (hors du repo Git) :
- `.env.local` — clés API
- Exports des policies RLS (vérifiables via `supabase db diff`)
- Configuration SMS/OTP du fournisseur (Twilio, MessageBird)

## Plan de reprise

| Scénario | RTO | RPO | Procédure |
|----------|-----|-----|-----------|
| Suppression accidentelle de données | < 1h | 0 (PITR) | Restaurer depuis PITR Supabase |
| Corruption DB | < 2h | 24h | Restaurer depuis dump quotidien |
| Perte Supabase | < 4h | 24h | Recréer projet + restaurer dump + storage |
| Perte complète | < 8h | 7j | Déployer depuis Git + restaurer backups |

## Crontab recommandé (serveur de backup)

```cron
# Dump DB tous les jours à 2h du matin
0 2 * * * /usr/local/bin/supabase db dump --project-ref $REF > /backups/db/numalex_$(date +\%Y\%m\%d).sql 2>&1

# Sync storage tous les dimanches
0 3 * * 0 /usr/local/bin/supabase storage cp -r documents/ /backups/storage/ --project-ref $REF 2>&1

# Rotation : garder 30 jours
0 4 * * * find /backups/db/ -name "*.sql" -mtime +30 -delete
```

## Vérification des sauvegardes

Effectuer mensuellement :

1. Restaurer le dernier dump dans un projet Supabase de test
2. Vérifier que les tables contiennent des données
3. Vérifier que les RLS fonctionnent
4. Tester un login et une requête métier
5. Documenter le résultat dans un registre

## Chiffrement

- Les dumps doivent être chiffrés au repos : `gpg --symmetric backup.sql`
- Les transferts doivent utiliser TLS (Supabase CLI le fait par défaut)
- Les clés de chiffrement doivent être stockées séparément des backups
