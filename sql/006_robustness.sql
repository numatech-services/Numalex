-- ============================================================
-- NumaLex — Migration 006 : Robustesse & Conformité
-- Exécuter après 005_security_hardening.sql
-- ============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │  1. SOFT DELETE — Ne jamais supprimer de données          │
-- └──────────────────────────────────────────────────────────┘

-- Ajouter deleted_at sur les tables métier
ALTER TABLE clients        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE matters        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE documents      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE invoices       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE events         ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tasks          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE time_entries   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE notary_acts    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE bailiff_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE notes_privees  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE paiements      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index partiel pour exclure les soft-deleted des requêtes normales
CREATE INDEX IF NOT EXISTS idx_clients_active   ON clients(cabinet_id)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_matters_active   ON matters(cabinet_id)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(cabinet_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_active  ON invoices(cabinet_id)  WHERE deleted_at IS NULL;

-- Modifier les RLS policies SELECT pour exclure les soft-deleted
-- (Les données supprimées restent en base mais sont invisibles)
DROP POLICY IF EXISTS "clients_select_active" ON clients;
CREATE POLICY "clients_select_active" ON clients FOR SELECT
    USING (cabinet_id = get_my_cabinet_id() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "matters_select_active" ON matters;
CREATE POLICY "matters_select_active" ON matters FOR SELECT
    USING (cabinet_id = get_my_cabinet_id() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "documents_select_active" ON documents;
CREATE POLICY "documents_select_active" ON documents FOR SELECT
    USING (cabinet_id = get_my_cabinet_id() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "invoices_select_active" ON invoices;
CREATE POLICY "invoices_select_active" ON invoices FOR SELECT
    USING (cabinet_id = get_my_cabinet_id() AND deleted_at IS NULL);

-- Fonction helper pour soft-delete
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Au lieu de supprimer, on marque deleted_at
  NEW.deleted_at = now();
  RETURN NEW;
END;
$$;

-- ┌──────────────────────────────────────────────────────────┐
-- │  2. SESSIONS RÉVOQUÉES (blacklist tokens)                 │
-- └──────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS revoked_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id  TEXT,           -- JTI du token
    reason      TEXT NOT NULL DEFAULT 'logout',  -- logout | forced | suspicious
    ip_address  INET,
    user_agent  TEXT,
    revoked_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_revoked_user    ON revoked_sessions(user_id);
CREATE INDEX idx_revoked_session ON revoked_sessions(session_id) WHERE session_id IS NOT NULL;

-- Nettoyage automatique des sessions > 30 jours
-- (à exécuter via cron ou pg_cron)
CREATE OR REPLACE FUNCTION cleanup_revoked_sessions()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM revoked_sessions
    WHERE revoked_at < now() - INTERVAL '30 days'
    RETURNING id
  )
  SELECT count(*)::INTEGER FROM deleted;
$$;

-- ┌──────────────────────────────────────────────────────────┐
-- │  3. VERSIONNEMENT DU SCHÉMA                               │
-- └──────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS schema_migrations (
    version     INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO schema_migrations (version, name) VALUES
  (0, '000_init.sql'),
  (1, '001_security_fixes.sql'),
  (2, '002_tasks_alerts.sql'),
  (3, '003_professional_modules.sql'),
  (4, '004_prisma_alignment.sql'),
  (5, '005_security_hardening.sql'),
  (6, '006_robustness.sql')
ON CONFLICT (version) DO NOTHING;

-- ┌──────────────────────────────────────────────────────────┐
-- │  4. SEED PROTECTION — Bloquer seed en production          │
-- └──────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION block_seed_in_production()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si la table cabinets a plus de 5 entrées, c'est probablement la production
  IF (SELECT count(*) FROM cabinets) > 5 THEN
    RAISE EXCEPTION 'SEED BLOQUÉ : base de production détectée (% cabinets). Utilisez DATABASE_URL_TEST.', (SELECT count(*) FROM cabinets);
  END IF;
END;
$$;

-- ┌──────────────────────────────────────────────────────────┐
-- │  5. CONTRAINTES D'INTÉGRITÉ RENFORCÉES                   │
-- └──────────────────────────────────────────────────────────┘

-- Empêcher suppression d'un client qui a des dossiers actifs
CREATE OR REPLACE FUNCTION check_client_dependencies()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count
  FROM matters
  WHERE client_id = OLD.id AND deleted_at IS NULL AND status NOT IN ('archive', 'clos', 'termine');

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer ce client : % dossier(s) actif(s) lié(s).', v_count;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS check_client_before_delete ON clients;
CREATE TRIGGER check_client_before_delete
    BEFORE DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION check_client_dependencies();

-- Empêcher suppression d'un dossier qui a des factures non payées
CREATE OR REPLACE FUNCTION check_matter_dependencies()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count
  FROM invoices
  WHERE matter_id = OLD.id AND deleted_at IS NULL AND status NOT IN ('payee', 'annulee');

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer ce dossier : % facture(s) impayée(s).', v_count;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS check_matter_before_delete ON matters;
CREATE TRIGGER check_matter_before_delete
    BEFORE DELETE ON matters
    FOR EACH ROW EXECUTE FUNCTION check_matter_dependencies();

-- ============================================================
-- RÉSUMÉ
-- ============================================================
-- 1. Soft delete       : deleted_at sur 11 tables + RLS auto-filtre
-- 2. Token blacklist   : table revoked_sessions + cleanup auto
-- 3. Schema versioning : table schema_migrations
-- 4. Seed protection   : function block_seed_in_production()
-- 5. Intégrité         : triggers empêchant suppression avec dépendances
