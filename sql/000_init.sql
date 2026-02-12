-- ============================================================
-- NumaLex — Script d'initialisation de la base de données
-- SaaS pour professionnels du droit au Niger (OHADA)
-- Compatible Supabase (PostgreSQL)
-- ============================================================

-- ============================================================
-- 1. TYPES ÉNUMÉRÉS (ENUMS)
-- ============================================================

CREATE TYPE user_role AS ENUM ('avocat', 'huissier', 'notaire');
CREATE TYPE client_type AS ENUM ('physique', 'morale');
CREATE TYPE matter_status AS ENUM ('ouvert', 'en_cours', 'suspendu', 'clos', 'archive');
CREATE TYPE event_type AS ENUM ('audience', 'rdv', 'deadline', 'autre');
CREATE TYPE document_type AS ENUM ('assignation', 'conclusions', 'jugement', 'contrat', 'proces_verbal', 'facture', 'correspondance', 'autre');
CREATE TYPE invoice_status AS ENUM ('brouillon', 'envoyee', 'payee', 'en_retard', 'annulee');

-- ============================================================
-- 2. TABLE : cabinets
--    Entité pivot pour l'isolation des données (multi-tenant)
-- ============================================================

CREATE TABLE cabinets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    nif         TEXT,                          -- Numéro d'Identification Fiscale (Niger)
    address     TEXT,
    phone       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE cabinets IS 'Cabinet / étude — unité de cloisonnement multi-tenant';

-- ============================================================
-- 3. TABLE : profiles
--    Extension de auth.users, liée au cabinet
-- ============================================================

CREATE TABLE profiles (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    role         user_role NOT NULL DEFAULT 'avocat',
    full_name    TEXT,
    phone        TEXT,
    avatar_url   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Profil utilisateur lié à auth.users et à un cabinet';

-- Index pour les recherches fréquentes par cabinet
CREATE INDEX idx_profiles_cabinet ON profiles(cabinet_id);

-- ============================================================
-- 4. TABLE : clients
-- ============================================================

CREATE TABLE clients (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    full_name    TEXT NOT NULL,
    client_type  client_type NOT NULL DEFAULT 'physique',
    phone        TEXT,
    email        TEXT,
    address      TEXT,
    notes        TEXT,
    created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE clients IS 'Clients du cabinet (personnes physiques ou morales)';

CREATE INDEX idx_clients_cabinet ON clients(cabinet_id);
CREATE INDEX idx_clients_name    ON clients(cabinet_id, full_name);

-- ============================================================
-- 5. TABLE : matters (Dossiers)
-- ============================================================

CREATE TABLE matters (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id       UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
    reference        TEXT,                       -- Référence interne du dossier
    title            TEXT NOT NULL,
    description      TEXT,
    status           matter_status NOT NULL DEFAULT 'ouvert',
    juridiction      TEXT,                       -- Ex : TGI Niamey, Cour d'appel, CCJA
    parties_adverses TEXT,                       -- Parties adverses (texte libre ou JSON)
    date_signification DATE,                     -- Huissier : date de signification de l'acte
    assigned_to      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    opened_at        DATE DEFAULT CURRENT_DATE,
    closed_at        DATE,
    created_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE matters IS 'Dossiers juridiques du cabinet';

CREATE INDEX idx_matters_cabinet  ON matters(cabinet_id);
CREATE INDEX idx_matters_client   ON matters(client_id);
CREATE INDEX idx_matters_status   ON matters(cabinet_id, status);
CREATE INDEX idx_matters_date_signif ON matters(cabinet_id, date_signification);

-- ============================================================
-- 6. TABLE : events (Agenda)
-- ============================================================

CREATE TABLE events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    matter_id    UUID REFERENCES matters(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    event_type   event_type NOT NULL DEFAULT 'rdv',
    starts_at    TIMESTAMPTZ NOT NULL,
    ends_at      TIMESTAMPTZ,
    location     TEXT,
    description  TEXT,
    reminder_at  TIMESTAMPTZ,                  -- Rappel optionnel
    created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE events IS 'Événements : audiences, rendez-vous, deadlines';

CREATE INDEX idx_events_cabinet   ON events(cabinet_id);
CREATE INDEX idx_events_matter    ON events(matter_id);
CREATE INDEX idx_events_date      ON events(cabinet_id, starts_at);

-- ============================================================
-- 7. TABLE : documents
-- ============================================================

CREATE TABLE documents (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    matter_id    UUID REFERENCES matters(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    doc_type     document_type NOT NULL DEFAULT 'autre',
    file_url     TEXT NOT NULL,                 -- URL vers Supabase Storage
    file_size    BIGINT,                        -- Taille en octets
    mime_type    TEXT,
    uploaded_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE documents IS 'Documents liés aux dossiers (stockés dans Supabase Storage)';

CREATE INDEX idx_documents_cabinet ON documents(cabinet_id);
CREATE INDEX idx_documents_matter  ON documents(matter_id);

-- ============================================================
-- 8. TABLE : invoices (Factures)
--    TVA Niger = 19% (conforme au Code Général des Impôts)
-- ============================================================

CREATE TABLE invoices (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id     UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    matter_id      UUID REFERENCES matters(id) ON DELETE SET NULL,
    client_id      UUID REFERENCES clients(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,                -- Numérotation séquentielle obligatoire
    amount_ht      NUMERIC(12, 2) NOT NULL DEFAULT 0,       -- Montant Hors Taxes
    tva_rate       NUMERIC(5, 2)  NOT NULL DEFAULT 19.00,    -- Taux TVA (19%)
    tva_amount     NUMERIC(12, 2) GENERATED ALWAYS AS (amount_ht * tva_rate / 100) STORED,
    total_ttc      NUMERIC(12, 2) GENERATED ALWAYS AS (amount_ht * (1 + tva_rate / 100)) STORED,
    status         invoice_status NOT NULL DEFAULT 'brouillon',
    issued_at      DATE,
    due_at         DATE,
    paid_at        DATE,
    notes          TEXT,
    created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE invoices IS 'Factures — montants en FCFA, TVA 19% (Niger)';

CREATE INDEX idx_invoices_cabinet ON invoices(cabinet_id);
CREATE INDEX idx_invoices_client  ON invoices(client_id);
CREATE INDEX idx_invoices_status  ON invoices(cabinet_id, status);
CREATE UNIQUE INDEX idx_invoices_number ON invoices(cabinet_id, invoice_number);

-- ============================================================
-- 9. FONCTION UTILITAIRE : récupérer le cabinet_id de l'utilisateur courant
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_cabinet_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT cabinet_id FROM public.profiles WHERE id = auth.uid()
$$;

COMMENT ON FUNCTION get_my_cabinet_id IS 'Retourne le cabinet_id du user connecté — utilisé dans les policies RLS';

-- ============================================================
-- 10. TRIGGER : mise à jour automatique de updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Appliquer le trigger sur toutes les tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['cabinets','profiles','clients','matters','events','documents','invoices']
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
            t
        );
    END LOOP;
END;
$$;

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS)
--     Principe : chaque utilisateur ne voit que les données
--     de son propre cabinet.
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE cabinets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters   ENABLE ROW LEVEL SECURITY;
ALTER TABLE events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices  ENABLE ROW LEVEL SECURITY;

-- ---- cabinets ----
CREATE POLICY "Membres du cabinet : lecture"
    ON cabinets FOR SELECT
    USING (id = get_my_cabinet_id());

CREATE POLICY "Membres du cabinet : modification"
    ON cabinets FOR UPDATE
    USING (id = get_my_cabinet_id());

CREATE POLICY "Création de cabinet à l'inscription"
    ON cabinets FOR INSERT
    WITH CHECK (true);

-- ---- profiles ----
CREATE POLICY "Voir les profils de son cabinet"
    ON profiles FOR SELECT
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Modifier son propre profil"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Insertion profil à l'inscription"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- ---- clients ----
CREATE POLICY "Clients de son cabinet : lecture"
    ON clients FOR SELECT
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Clients de son cabinet : insertion"
    ON clients FOR INSERT
    WITH CHECK (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Clients de son cabinet : modification"
    ON clients FOR UPDATE
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Clients de son cabinet : suppression"
    ON clients FOR DELETE
    USING (cabinet_id = get_my_cabinet_id());

-- ---- matters ----
CREATE POLICY "Dossiers de son cabinet : lecture"
    ON matters FOR SELECT
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Dossiers de son cabinet : insertion"
    ON matters FOR INSERT
    WITH CHECK (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Dossiers de son cabinet : modification"
    ON matters FOR UPDATE
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Dossiers de son cabinet : suppression"
    ON matters FOR DELETE
    USING (cabinet_id = get_my_cabinet_id());

-- ---- events ----
CREATE POLICY "Événements de son cabinet : lecture"
    ON events FOR SELECT
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Événements de son cabinet : insertion"
    ON events FOR INSERT
    WITH CHECK (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Événements de son cabinet : modification"
    ON events FOR UPDATE
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Événements de son cabinet : suppression"
    ON events FOR DELETE
    USING (cabinet_id = get_my_cabinet_id());

-- ---- documents ----
CREATE POLICY "Documents de son cabinet : lecture"
    ON documents FOR SELECT
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Documents de son cabinet : insertion"
    ON documents FOR INSERT
    WITH CHECK (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Documents de son cabinet : modification"
    ON documents FOR UPDATE
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Documents de son cabinet : suppression"
    ON documents FOR DELETE
    USING (cabinet_id = get_my_cabinet_id());

-- ---- invoices ----
CREATE POLICY "Factures de son cabinet : lecture"
    ON invoices FOR SELECT
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Factures de son cabinet : insertion"
    ON invoices FOR INSERT
    WITH CHECK (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Factures de son cabinet : modification"
    ON invoices FOR UPDATE
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Factures de son cabinet : suppression"
    ON invoices FOR DELETE
    USING (cabinet_id = get_my_cabinet_id());

-- ============================================================
-- 12. STORAGE BUCKET pour les documents
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Policies Storage : accès limité au cabinet
CREATE POLICY "Upload documents cabinet"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = get_my_cabinet_id()::text
    );

CREATE POLICY "Lecture documents cabinet"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = get_my_cabinet_id()::text
    );

CREATE POLICY "Suppression documents cabinet"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = get_my_cabinet_id()::text
    );

-- ============================================================
-- FIN DU SCRIPT
-- Prêt à être exécuté dans l'éditeur SQL de Supabase.
-- ============================================================
