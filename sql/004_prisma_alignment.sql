-- ============================================================
-- NumaLex — Migration 004 : Alignement schéma Prisma MVP
-- Corrige TOUS les écarts identifiés entre notre SQL et le
-- schéma de référence (CRM Juridique Niger / OHADA).
-- Exécuter après 003_professional_modules.sql
-- ============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │  1. CABINET / TENANT — Colonnes manquantes               │
-- └──────────────────────────────────────────────────────────┘

ALTER TABLE cabinets
  ADD COLUMN IF NOT EXISTS profession   TEXT CHECK (profession IN ('avocat', 'notaire', 'commissaire_justice')),
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS rccm         TEXT,       -- Registre du Commerce (OHADA)
  ADD COLUMN IF NOT EXISTS sous_domaine TEXT UNIQUE; -- sous-domaine SaaS (ex: cabinet-issa.numalex.ne)

COMMENT ON COLUMN cabinets.profession     IS 'Profession du cabinet : avocat | notaire | commissaire_justice';
COMMENT ON COLUMN cabinets.rccm           IS 'Numéro RCCM — Registre du Commerce et du Crédit Mobilier (OHADA)';
COMMENT ON COLUMN cabinets.sous_domaine   IS 'Sous-domaine unique pour accès SaaS';

-- ┌──────────────────────────────────────────────────────────┐
-- │  2. USERS & AUTH — RBAC complet + 2FA + désactivation    │
-- └──────────────────────────────────────────────────────────┘

-- 2a. Nouveau enum RBAC aligné sur Prisma
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_v2') THEN
    CREATE TYPE user_role_v2 AS ENUM (
      'admin', 'associe', 'collaborateur', 'secretariat', 'lecture'
    );
  END IF;
END $$;

-- 2b. Ajouter les colonnes manquantes aux profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name         TEXT,
  ADD COLUMN IF NOT EXISTS last_name          TEXT,
  ADD COLUMN IF NOT EXISTS rbac_role          user_role_v2 NOT NULL DEFAULT 'collaborateur',
  ADD COLUMN IF NOT EXISTS active             BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS two_factor_secret  TEXT,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS backup_codes       TEXT;    -- JSON array de codes de secours chiffrés

COMMENT ON COLUMN profiles.rbac_role          IS 'Rôle RBAC : admin | associe | collaborateur | secretariat | lecture';
COMMENT ON COLUMN profiles.active             IS 'Compte actif. false = désactivé, ne peut plus se connecter.';
COMMENT ON COLUMN profiles.two_factor_secret  IS 'Secret TOTP pour authentification 2FA (chiffré côté app)';
COMMENT ON COLUMN profiles.backup_codes       IS 'Codes de secours 2FA (JSON chiffré)';

-- Index pour bloquer les comptes inactifs rapidement
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active) WHERE NOT active;

-- ┌──────────────────────────────────────────────────────────┐
-- │  3. DOSSIERS — Colonnes manquantes                       │
-- └──────────────────────────────────────────────────────────┘

-- 3a. Nouveau enum statut dossier aligné Prisma (6 valeurs)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dossier_status') THEN
    CREATE TYPE dossier_status AS ENUM (
      'brouillon', 'ouvert', 'en_cours', 'suspendu', 'termine', 'archive'
    );
  END IF;
END $$;

-- 3b. Ajouter les colonnes manquantes
ALTER TABLE matters
  ADD COLUMN IF NOT EXISTS collaborators    JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS tags             TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS court_number     TEXT,          -- Numéro de rôle au tribunal
  ADD COLUMN IF NOT EXISTS profession       TEXT CHECK (profession IN ('avocat', 'notaire', 'commissaire_justice'));

-- Rendre reference UNIQUE (si pas déjà)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matters_reference_unique') THEN
    ALTER TABLE matters ADD CONSTRAINT matters_reference_unique UNIQUE (cabinet_id, reference);
  END IF;
END $$;

COMMENT ON COLUMN matters.collaborators IS 'Collaborateurs assignés [{userId, role, since}]';
COMMENT ON COLUMN matters.tags          IS 'Tags libres pour classification (TEXT array)';
COMMENT ON COLUMN matters.court_number  IS 'Numéro de rôle / enregistrement au tribunal';
COMMENT ON COLUMN matters.profession    IS 'Type de dossier par profession';

CREATE INDEX IF NOT EXISTS idx_matters_tags ON matters USING GIN (tags);

-- ┌──────────────────────────────────────────────────────────┐
-- │  4. ÉVÉNEMENTS / TIMELINE — Types étendus + metadata     │
-- └──────────────────────────────────────────────────────────┘

-- 4a. Nouvel enum EventType complet (11 valeurs juridiques)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type_v2') THEN
    CREATE TYPE event_type_v2 AS ENUM (
      'audience', 'acte', 'signification', 'constat',
      'paiement', 'depot', 'jugement', 'appel',
      'saisie', 'expulsion', 'autre'
    );
  END IF;
END $$;

-- 4b. Ajouter les colonnes manquantes aux events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_type_v2  event_type_v2,
  ADD COLUMN IF NOT EXISTS created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata       JSONB DEFAULT '{}';

COMMENT ON COLUMN events.event_type_v2 IS 'Typologie juridique étendue (11 types)';
COMMENT ON COLUMN events.created_by    IS 'Créateur de l événement (traçabilité)';
COMMENT ON COLUMN events.metadata      IS 'Métadonnées extensibles (JSON libre)';

-- ┌──────────────────────────────────────────────────────────┐
-- │  5. GED — Versioning, hash, arborescence                 │
-- └──────────────────────────────────────────────────────────┘

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS file_hash   TEXT,          -- SHA-256 pour intégrité
  ADD COLUMN IF NOT EXISTS version     INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_id   UUID REFERENCES documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN documents.file_hash  IS 'Hash SHA-256 du fichier pour vérification d intégrité';
COMMENT ON COLUMN documents.version    IS 'Numéro de version (incrémenté à chaque remplacement)';
COMMENT ON COLUMN documents.parent_id  IS 'Document parent pour arborescence / dossiers virtuels';

CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_hash   ON documents(file_hash) WHERE file_hash IS NOT NULL;

-- ┌──────────────────────────────────────────────────────────┐
-- │  6. FACTURATION — Devise, émetteur, statut PARTIELLE     │
-- └──────────────────────────────────────────────────────────┘

-- 6a. Ajouter colonnes manquantes aux invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS devise      TEXT NOT NULL DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS issued_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS objet       TEXT;         -- Objet / désignation de la facture

COMMENT ON COLUMN invoices.devise    IS 'Devise : XOF (Franc CFA) par défaut';
COMMENT ON COLUMN invoices.issued_by IS 'Émetteur de la facture (utilisateur)';

-- 6b. TABLE PAIEMENTS (multi-paiements par facture)
CREATE TABLE IF NOT EXISTS paiements (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    facture_id   UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    montant      NUMERIC(12, 2) NOT NULL CHECK (montant > 0),
    mode         TEXT NOT NULL DEFAULT 'especes'
                 CHECK (mode IN ('especes', 'virement', 'cheque', 'orange_money', 'airtel_money', 'wave', 'carte', 'autre')),
    reference    TEXT,               -- Référence de transaction (mobile money, etc.)
    statut       TEXT NOT NULL DEFAULT 'reussi'
                 CHECK (statut IN ('en_attente', 'reussi', 'echoue', 'rembourse')),
    notes        TEXT,
    paid_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE paiements IS 'Paiements multiples par facture — prêt pour mobile money';

CREATE INDEX idx_paiements_cabinet  ON paiements(cabinet_id);
CREATE INDEX idx_paiements_facture  ON paiements(facture_id);
CREATE INDEX idx_paiements_mode     ON paiements(mode);

ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paiements_select" ON paiements FOR SELECT USING (cabinet_id = get_my_cabinet_id());
CREATE POLICY "paiements_insert" ON paiements FOR INSERT WITH CHECK (cabinet_id = get_my_cabinet_id());
CREATE POLICY "paiements_update" ON paiements FOR UPDATE USING (cabinet_id = get_my_cabinet_id());
CREATE POLICY "paiements_delete" ON paiements FOR DELETE USING (cabinet_id = get_my_cabinet_id());

-- ┌──────────────────────────────────────────────────────────┐
-- │  7. NOTES PRIVÉES                                        │
-- └──────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS notes_privees (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    dossier_id   UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    auteur_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    contenu      TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE notes_privees IS 'Notes privées par dossier — non partageables avec le client';

CREATE INDEX idx_notes_dossier ON notes_privees(dossier_id);
CREATE INDEX idx_notes_auteur  ON notes_privees(auteur_id);

ALTER TABLE notes_privees ENABLE ROW LEVEL SECURITY;

-- Seul l'auteur peut voir ses propres notes
CREATE POLICY "notes_privees_select" ON notes_privees FOR SELECT
    USING (cabinet_id = get_my_cabinet_id() AND auteur_id = auth.uid());

CREATE POLICY "notes_privees_insert" ON notes_privees FOR INSERT
    WITH CHECK (cabinet_id = get_my_cabinet_id() AND auteur_id = auth.uid());

CREATE POLICY "notes_privees_update" ON notes_privees FOR UPDATE
    USING (cabinet_id = get_my_cabinet_id() AND auteur_id = auth.uid());

CREATE POLICY "notes_privees_delete" ON notes_privees FOR DELETE
    USING (cabinet_id = get_my_cabinet_id() AND auteur_id = auth.uid());

CREATE TRIGGER set_notes_privees_updated_at
    BEFORE UPDATE ON notes_privees
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ┌──────────────────────────────────────────────────────────┐
-- │  8. AUDIT LOG — Renforcement immutabilité                │
-- └──────────────────────────────────────────────────────────┘

-- Ajouter les colonnes manquantes à audit_log
ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS resource      TEXT,
  ADD COLUMN IF NOT EXISTS resource_id   TEXT,
  ADD COLUMN IF NOT EXISTS metadata      JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ip_address    INET;

-- Rendre l'audit log IMMUTABLE : pas de UPDATE ni DELETE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_log' AND policyname = 'audit_no_update'
  ) THEN
    -- Bloquer les modifications (immutabilité judiciaire)
    CREATE POLICY "audit_no_update" ON audit_log FOR UPDATE USING (false);
    CREATE POLICY "audit_no_delete" ON audit_log FOR DELETE USING (false);
  END IF;
END $$;

COMMENT ON TABLE audit_log IS 'Journal d audit IMMUTABLE — conforme aux exigences judiciaires. Pas de modification ni suppression possible.';

-- ┌──────────────────────────────────────────────────────────┐
-- │  9. TÂCHES — Aligner statut et assignation               │
-- └──────────────────────────────────────────────────────────┘

-- Le schéma Prisma a : statut(A_FAIRE/EN_COURS/FAIT), priorité(BASSE/MOYENNE/HAUTE/URGENTE)
-- Notre table tasks a déjà priority et completed boolean, ajoutons statut textuel
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS statut TEXT NOT NULL DEFAULT 'a_faire'
      CHECK (statut IN ('a_faire', 'en_cours', 'fait', 'annule'));

-- ┌──────────────────────────────────────────────────────────┐
-- │  10. TRIGGER AUDIT ÉTENDU — Toutes les tables sensibles  │
-- └──────────────────────────────────────────────────────────┘

-- Fonction générique d'audit pour n'importe quelle table
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (cabinet_id, user_id, action, resource, resource_id, metadata)
    VALUES (
      OLD.cabinet_id,
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id::TEXT,
      jsonb_build_object('old', row_to_json(OLD))
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (cabinet_id, user_id, action, resource, resource_id, metadata)
    VALUES (
      NEW.cabinet_id,
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id::TEXT,
      jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (cabinet_id, user_id, action, resource, resource_id, metadata)
    VALUES (
      NEW.cabinet_id,
      auth.uid(),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id::TEXT,
      jsonb_build_object('new', row_to_json(NEW))
    );
    RETURN NEW;
  END IF;
END;
$$;

-- Appliquer l'audit sur toutes les tables sensibles
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'matters', 'documents', 'invoices', 'paiements', 'events',
    'clients', 'tasks', 'notary_acts', 'bailiff_reports', 'notes_privees'
  ]) LOOP
    -- Supprimer l'ancien trigger s'il existe pour éviter les doublons
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%s ON public.%I', tbl, tbl);
    -- Créer le nouveau trigger
    EXECUTE format(
      'CREATE TRIGGER audit_%s AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- RÉSUMÉ DES CORRECTIONS
-- ============================================================
-- 1. Cabinets   : +profession, +email, +rccm, +sous_domaine
-- 2. Profiles   : +first_name, +last_name, +rbac_role(5 niveaux), +active,
--                  +two_factor_secret, +two_factor_enabled, +backup_codes
-- 3. Matters    : +collaborators(JSONB), +tags(TEXT[]), +court_number,
--                  +profession, reference UNIQUE par cabinet
-- 4. Events     : +event_type_v2(11 types juridiques), +created_by, +metadata(JSONB)
-- 5. Documents  : +file_hash(SHA-256), +version, +parent_id, +uploaded_by
-- 6. Invoices   : +devise(XOF), +issued_by, +objet
--    Paiements  : NOUVELLE TABLE (multi-paiements, mobile money ready)
-- 7. Notes      : NOUVELLE TABLE notes_privees (non partageables)
-- 8. Audit      : +resource, +resource_id, +metadata, +ip_address, IMMUTABLE
-- 9. Tâches     : +statut textuel (a_faire/en_cours/fait/annule)
-- 10. Triggers  : Audit automatique sur 10 tables sensibles
