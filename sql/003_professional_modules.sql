-- ============================================================
-- NumaLex — Migration 003 : Modules métier + Portail client
-- Exécuter après 002_tasks_alerts.sql
-- ============================================================

-- ─── ENUM : rôle étendu (admin, staff, client_portal) ───

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin', 'staff', 'client_portal');
  END IF;
END $$;

-- Ajouter la colonne app_role aux profiles (en plus de user_role métier)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_role app_role NOT NULL DEFAULT 'staff';

-- ─── TABLE : time_entries (Suivi du temps — Avocats) ───

CREATE TABLE IF NOT EXISTS time_entries (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    matter_id    UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    minutes      INT NOT NULL CHECK (minutes > 0 AND minutes <= 1440),
    hourly_rate  NUMERIC(10, 2),           -- Taux horaire FCFA (optionnel)
    amount       NUMERIC(12, 2) GENERATED ALWAYS AS (
                   CASE WHEN hourly_rate IS NOT NULL
                        THEN ROUND(minutes * hourly_rate / 60, 2)
                        ELSE NULL END
                 ) STORED,
    description  TEXT NOT NULL,
    entry_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    billable     BOOLEAN NOT NULL DEFAULT true,
    invoiced     BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE time_entries IS 'Suivi du temps — module Avocat. Montants en FCFA.';

CREATE INDEX idx_time_cabinet   ON time_entries(cabinet_id);
CREATE INDEX idx_time_matter    ON time_entries(matter_id);
CREATE INDEX idx_time_user      ON time_entries(user_id, entry_date);
CREATE INDEX idx_time_billable  ON time_entries(cabinet_id, billable, invoiced) WHERE billable AND NOT invoiced;

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_entries_select" ON time_entries FOR SELECT USING (cabinet_id = get_my_cabinet_id());
CREATE POLICY "time_entries_insert" ON time_entries FOR INSERT WITH CHECK (cabinet_id = get_my_cabinet_id());
CREATE POLICY "time_entries_update" ON time_entries FOR UPDATE USING (cabinet_id = get_my_cabinet_id());
CREATE POLICY "time_entries_delete" ON time_entries FOR DELETE USING (cabinet_id = get_my_cabinet_id());

CREATE TRIGGER set_time_entries_updated_at BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ─── TABLE : notary_acts (Actes notariés — Notaires) ───

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'act_type') THEN
    CREATE TYPE act_type AS ENUM (
      'vente_immobiliere', 'donation', 'testament', 'constitution_societe',
      'bail', 'procuration', 'certificat_heritage', 'acte_notoriete', 'autre'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS notary_acts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    matter_id    UUID REFERENCES matters(id) ON DELETE SET NULL,
    client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
    act_type     act_type NOT NULL DEFAULT 'autre',
    act_number   TEXT,                      -- Numéro du répertoire
    title        TEXT NOT NULL,
    parties      JSONB DEFAULT '[]',        -- [{name, role, id_number}]
    description  TEXT,
    act_date     DATE,
    signed       BOOLEAN NOT NULL DEFAULT false,
    signed_at    TIMESTAMPTZ,
    notary_fees  NUMERIC(12, 2),           -- Frais de notaire FCFA
    tax_amount   NUMERIC(12, 2),           -- Droits d'enregistrement
    file_url     TEXT,                      -- Document PDF signé
    created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE notary_acts IS 'Actes notariés — module Notaire. Répertoire OHADA.';

CREATE INDEX idx_acts_cabinet    ON notary_acts(cabinet_id);
CREATE INDEX idx_acts_matter     ON notary_acts(matter_id);
CREATE INDEX idx_acts_number     ON notary_acts(cabinet_id, act_number);
CREATE INDEX idx_acts_signed     ON notary_acts(cabinet_id, signed);

ALTER TABLE notary_acts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notary_acts_select" ON notary_acts FOR SELECT USING (cabinet_id = get_my_cabinet_id());
CREATE POLICY "notary_acts_insert" ON notary_acts FOR INSERT WITH CHECK (cabinet_id = get_my_cabinet_id());
CREATE POLICY "notary_acts_update" ON notary_acts FOR UPDATE USING (cabinet_id = get_my_cabinet_id());
CREATE POLICY "notary_acts_delete" ON notary_acts FOR DELETE USING (cabinet_id = get_my_cabinet_id());

CREATE TRIGGER set_notary_acts_updated_at BEFORE UPDATE ON notary_acts
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ─── TABLE : bailiff_reports (Procès-verbaux — Huissiers) ───

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_type') THEN
    CREATE TYPE report_type AS ENUM (
      'constat', 'signification', 'saisie', 'expulsion',
      'inventaire', 'sommation', 'autre'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS bailiff_reports (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    matter_id    UUID REFERENCES matters(id) ON DELETE SET NULL,
    client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
    report_type  report_type NOT NULL DEFAULT 'constat',
    report_number TEXT,                     -- Numéro PV
    title        TEXT NOT NULL,
    location     TEXT,                      -- Adresse du constat
    gps_lat      NUMERIC(10, 7),           -- Coordonnées GPS
    gps_lng      NUMERIC(10, 7),
    description  TEXT,                      -- Corps du rapport
    witnesses    JSONB DEFAULT '[]',        -- [{name, id_number}]
    photos       JSONB DEFAULT '[]',        -- [url1, url2...]
    report_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    served       BOOLEAN NOT NULL DEFAULT false,
    served_at    TIMESTAMPTZ,
    served_to    TEXT,                       -- Nom de la personne servie
    file_url     TEXT,                       -- Document PDF final
    fees         NUMERIC(12, 2),            -- Honoraires FCFA
    created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE bailiff_reports IS 'Procès-verbaux et constats — module Huissier.';

CREATE INDEX idx_reports_cabinet  ON bailiff_reports(cabinet_id);
CREATE INDEX idx_reports_matter   ON bailiff_reports(matter_id);
CREATE INDEX idx_reports_type     ON bailiff_reports(cabinet_id, report_type);
CREATE INDEX idx_reports_date     ON bailiff_reports(cabinet_id, report_date);

ALTER TABLE bailiff_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bailiff_reports_select" ON bailiff_reports FOR SELECT USING (cabinet_id = get_my_cabinet_id());
CREATE POLICY "bailiff_reports_insert" ON bailiff_reports FOR INSERT WITH CHECK (cabinet_id = get_my_cabinet_id());
CREATE POLICY "bailiff_reports_update" ON bailiff_reports FOR UPDATE USING (cabinet_id = get_my_cabinet_id());
CREATE POLICY "bailiff_reports_delete" ON bailiff_reports FOR DELETE USING (cabinet_id = get_my_cabinet_id());

CREATE TRIGGER set_bailiff_reports_updated_at BEFORE UPDATE ON bailiff_reports
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ─── TABLE : client_portal_access (Accès portail client) ───

CREATE TABLE IF NOT EXISTS client_portal_access (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL,             -- ID Supabase Auth de l'utilisateur client
    access_code  TEXT,                       -- Code d'accès initial
    active       BOOLEAN NOT NULL DEFAULT true,
    last_login   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(cabinet_id, client_id, auth_user_id)
);

COMMENT ON TABLE client_portal_access IS 'Liens entre clients et leurs comptes portail.';

CREATE INDEX idx_portal_cabinet ON client_portal_access(cabinet_id);
CREATE INDEX idx_portal_auth    ON client_portal_access(auth_user_id);

ALTER TABLE client_portal_access ENABLE ROW LEVEL SECURITY;

-- Les clients du portail voient uniquement leur accès
CREATE POLICY "portal_self_select" ON client_portal_access FOR SELECT
    USING (auth_user_id = auth.uid());

-- Le cabinet gère les accès
CREATE POLICY "portal_cabinet_select" ON client_portal_access FOR SELECT
    USING (cabinet_id = get_my_cabinet_id());
CREATE POLICY "portal_cabinet_insert" ON client_portal_access FOR INSERT
    WITH CHECK (cabinet_id = get_my_cabinet_id());
CREATE POLICY "portal_cabinet_update" ON client_portal_access FOR UPDATE
    USING (cabinet_id = get_my_cabinet_id());
CREATE POLICY "portal_cabinet_delete" ON client_portal_access FOR DELETE
    USING (cabinet_id = get_my_cabinet_id());

-- ─── RLS portail client : les clients voient leurs dossiers ───

CREATE POLICY "client_portal_matters_select" ON matters FOR SELECT
    USING (
      cabinet_id = get_my_cabinet_id()
      OR client_id IN (
        SELECT cpa.client_id FROM client_portal_access cpa
        WHERE cpa.auth_user_id = auth.uid() AND cpa.active = true
      )
    );

-- Même logique pour invoices et documents
CREATE POLICY "client_portal_invoices_select" ON invoices FOR SELECT
    USING (
      cabinet_id = get_my_cabinet_id()
      OR client_id IN (
        SELECT cpa.client_id FROM client_portal_access cpa
        WHERE cpa.auth_user_id = auth.uid() AND cpa.active = true
      )
    );

CREATE POLICY "client_portal_documents_select" ON documents FOR SELECT
    USING (
      cabinet_id = get_my_cabinet_id()
      OR matter_id IN (
        SELECT m.id FROM matters m
        JOIN client_portal_access cpa ON cpa.client_id = m.client_id
        WHERE cpa.auth_user_id = auth.uid() AND cpa.active = true
      )
    );

-- ─── TABLE : ai_logs (Logs IA assistant) ───

CREATE TABLE IF NOT EXISTS ai_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action       TEXT NOT NULL,              -- 'summarize', 'draft', 'analyze', etc.
    prompt       TEXT NOT NULL,
    response     TEXT,
    model        TEXT DEFAULT 'claude-sonnet-4-20250514',
    tokens_used  INT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_cabinet ON ai_logs(cabinet_id);
CREATE INDEX idx_ai_user    ON ai_logs(user_id, created_at);

ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_logs_select" ON ai_logs FOR SELECT USING (cabinet_id = get_my_cabinet_id());
CREATE POLICY "ai_logs_insert" ON ai_logs FOR INSERT WITH CHECK (cabinet_id = get_my_cabinet_id());
