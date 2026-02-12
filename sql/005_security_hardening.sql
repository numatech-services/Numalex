-- ============================================================
-- NumaLex — Migration 005 : Sécurité renforcée
-- Corrige TOUTES les failles identifiées dans l'audit.
-- Exécuter après 004_prisma_alignment.sql
-- ============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │  1. FIX get_my_cabinet_id() — search_path sécurisé       │
-- └──────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION get_my_cabinet_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cabinet_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ┌──────────────────────────────────────────────────────────┐
-- │  2. TABLE PERMISSIONS FINES — RBAC granulaire             │
-- └──────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS role_permissions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id       UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    rbac_role        TEXT NOT NULL,  -- admin, associe, collaborateur, secretariat, lecture

    -- Dossiers
    can_view_matters     BOOLEAN NOT NULL DEFAULT true,
    can_create_matters   BOOLEAN NOT NULL DEFAULT false,
    can_edit_matters     BOOLEAN NOT NULL DEFAULT false,
    can_delete_matters   BOOLEAN NOT NULL DEFAULT false,

    -- Clients
    can_view_clients     BOOLEAN NOT NULL DEFAULT true,
    can_create_clients   BOOLEAN NOT NULL DEFAULT false,
    can_edit_clients     BOOLEAN NOT NULL DEFAULT false,
    can_delete_clients   BOOLEAN NOT NULL DEFAULT false,

    -- Documents
    can_view_documents   BOOLEAN NOT NULL DEFAULT true,
    can_upload_documents BOOLEAN NOT NULL DEFAULT false,
    can_delete_documents BOOLEAN NOT NULL DEFAULT false,

    -- Factures & paiements
    can_view_invoices    BOOLEAN NOT NULL DEFAULT true,
    can_create_invoices  BOOLEAN NOT NULL DEFAULT false,
    can_edit_invoices    BOOLEAN NOT NULL DEFAULT false,
    can_record_payments  BOOLEAN NOT NULL DEFAULT false,

    -- Agenda
    can_view_events      BOOLEAN NOT NULL DEFAULT true,
    can_create_events    BOOLEAN NOT NULL DEFAULT false,
    can_edit_events      BOOLEAN NOT NULL DEFAULT false,

    -- Tâches
    can_view_tasks       BOOLEAN NOT NULL DEFAULT true,
    can_create_tasks     BOOLEAN NOT NULL DEFAULT false,
    can_edit_tasks       BOOLEAN NOT NULL DEFAULT false,

    -- Admin
    can_manage_users     BOOLEAN NOT NULL DEFAULT false,
    can_view_audit       BOOLEAN NOT NULL DEFAULT false,
    can_manage_settings  BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(cabinet_id, rbac_role)
);

COMMENT ON TABLE role_permissions IS 'Permissions fines par rôle RBAC et par cabinet — personnalisable.';

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_permissions_select" ON role_permissions FOR SELECT USING (cabinet_id = get_my_cabinet_id());
CREATE POLICY "role_permissions_admin"  ON role_permissions FOR ALL USING (
  cabinet_id = get_my_cabinet_id() AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rbac_role = 'admin')
);

-- Insérer les permissions par défaut pour chaque rôle
-- (déclenchées automatiquement lors de la création du cabinet via trigger)

CREATE OR REPLACE FUNCTION seed_default_permissions(p_cabinet_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin : tout
  INSERT INTO role_permissions (cabinet_id, rbac_role,
    can_view_matters, can_create_matters, can_edit_matters, can_delete_matters,
    can_view_clients, can_create_clients, can_edit_clients, can_delete_clients,
    can_view_documents, can_upload_documents, can_delete_documents,
    can_view_invoices, can_create_invoices, can_edit_invoices, can_record_payments,
    can_view_events, can_create_events, can_edit_events,
    can_view_tasks, can_create_tasks, can_edit_tasks,
    can_manage_users, can_view_audit, can_manage_settings
  ) VALUES (p_cabinet_id, 'admin',
    true, true, true, true,
    true, true, true, true,
    true, true, true,
    true, true, true, true,
    true, true, true,
    true, true, true,
    true, true, true
  ) ON CONFLICT (cabinet_id, rbac_role) DO NOTHING;

  -- Associé : presque tout, pas gestion users
  INSERT INTO role_permissions (cabinet_id, rbac_role,
    can_view_matters, can_create_matters, can_edit_matters, can_delete_matters,
    can_view_clients, can_create_clients, can_edit_clients, can_delete_clients,
    can_view_documents, can_upload_documents, can_delete_documents,
    can_view_invoices, can_create_invoices, can_edit_invoices, can_record_payments,
    can_view_events, can_create_events, can_edit_events,
    can_view_tasks, can_create_tasks, can_edit_tasks,
    can_manage_users, can_view_audit, can_manage_settings
  ) VALUES (p_cabinet_id, 'associe',
    true, true, true, true,
    true, true, true, true,
    true, true, true,
    true, true, true, true,
    true, true, true,
    true, true, true,
    false, true, false
  ) ON CONFLICT (cabinet_id, rbac_role) DO NOTHING;

  -- Collaborateur : CRUD sans suppression
  INSERT INTO role_permissions (cabinet_id, rbac_role,
    can_view_matters, can_create_matters, can_edit_matters, can_delete_matters,
    can_view_clients, can_create_clients, can_edit_clients, can_delete_clients,
    can_view_documents, can_upload_documents, can_delete_documents,
    can_view_invoices, can_create_invoices, can_edit_invoices, can_record_payments,
    can_view_events, can_create_events, can_edit_events,
    can_view_tasks, can_create_tasks, can_edit_tasks,
    can_manage_users, can_view_audit, can_manage_settings
  ) VALUES (p_cabinet_id, 'collaborateur',
    true, true, true, false,
    true, true, true, false,
    true, true, false,
    true, true, true, false,
    true, true, true,
    true, true, true,
    false, false, false
  ) ON CONFLICT (cabinet_id, rbac_role) DO NOTHING;

  -- Secrétariat : lecture + création limitée
  INSERT INTO role_permissions (cabinet_id, rbac_role,
    can_view_matters, can_create_matters, can_edit_matters, can_delete_matters,
    can_view_clients, can_create_clients, can_edit_clients, can_delete_clients,
    can_view_documents, can_upload_documents, can_delete_documents,
    can_view_invoices, can_create_invoices, can_edit_invoices, can_record_payments,
    can_view_events, can_create_events, can_edit_events,
    can_view_tasks, can_create_tasks, can_edit_tasks,
    can_manage_users, can_view_audit, can_manage_settings
  ) VALUES (p_cabinet_id, 'secretariat',
    true, false, false, false,
    true, true, true, false,
    true, true, false,
    true, true, false, true,
    true, true, true,
    true, true, true,
    false, false, false
  ) ON CONFLICT (cabinet_id, rbac_role) DO NOTHING;

  -- Lecture seule
  INSERT INTO role_permissions (cabinet_id, rbac_role,
    can_view_matters, can_create_matters, can_edit_matters, can_delete_matters,
    can_view_clients, can_create_clients, can_edit_clients, can_delete_clients,
    can_view_documents, can_upload_documents, can_delete_documents,
    can_view_invoices, can_create_invoices, can_edit_invoices, can_record_payments,
    can_view_events, can_create_events, can_edit_events,
    can_view_tasks, can_create_tasks, can_edit_tasks,
    can_manage_users, can_view_audit, can_manage_settings
  ) VALUES (p_cabinet_id, 'lecture',
    true, false, false, false,
    true, false, false, false,
    true, false, false,
    true, false, false, false,
    true, false, false,
    true, false, false,
    false, false, false
  ) ON CONFLICT (cabinet_id, rbac_role) DO NOTHING;
END;
$$;

-- ┌──────────────────────────────────────────────────────────┐
-- │  3. HELPER : vérifier une permission pour l'user courant  │
-- └──────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION check_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_cabinet_id UUID;
  v_result BOOLEAN;
BEGIN
  SELECT rbac_role, cabinet_id INTO v_role, v_cabinet_id
  FROM profiles WHERE id = auth.uid();

  IF v_role IS NULL THEN RETURN false; END IF;

  -- Admin a toujours tous les droits
  IF v_role = 'admin' THEN RETURN true; END IF;

  EXECUTE format(
    'SELECT %I FROM role_permissions WHERE cabinet_id = $1 AND rbac_role = $2',
    p_permission
  ) INTO v_result USING v_cabinet_id, v_role;

  RETURN COALESCE(v_result, false);
END;
$$;

GRANT EXECUTE ON FUNCTION check_permission(TEXT) TO authenticated;

-- ┌──────────────────────────────────────────────────────────┐
-- │  4. RLS RENFORCÉ — Policies strictes partout              │
-- └──────────────────────────────────────────────────────────┘

-- Recréer les policies critiques avec double vérification
-- (cabinet_id + permission fine)

-- MATTERS — écriture conditionnelle
DROP POLICY IF EXISTS "matters_insert_perm" ON matters;
CREATE POLICY "matters_insert_perm" ON matters FOR INSERT
    WITH CHECK (
      cabinet_id = get_my_cabinet_id()
      AND check_permission('can_create_matters')
    );

DROP POLICY IF EXISTS "matters_delete_perm" ON matters;
CREATE POLICY "matters_delete_perm" ON matters FOR DELETE
    USING (
      cabinet_id = get_my_cabinet_id()
      AND check_permission('can_delete_matters')
    );

-- DOCUMENTS — upload conditionnel
DROP POLICY IF EXISTS "documents_insert_perm" ON documents;
CREATE POLICY "documents_insert_perm" ON documents FOR INSERT
    WITH CHECK (
      cabinet_id = get_my_cabinet_id()
      AND check_permission('can_upload_documents')
    );

DROP POLICY IF EXISTS "documents_delete_perm" ON documents;
CREATE POLICY "documents_delete_perm" ON documents FOR DELETE
    USING (
      cabinet_id = get_my_cabinet_id()
      AND check_permission('can_delete_documents')
    );

-- INVOICES — création conditionnelle
DROP POLICY IF EXISTS "invoices_insert_perm" ON invoices;
CREATE POLICY "invoices_insert_perm" ON invoices FOR INSERT
    WITH CHECK (
      cabinet_id = get_my_cabinet_id()
      AND check_permission('can_create_invoices')
    );

-- PAIEMENTS — enregistrement conditionnel
DROP POLICY IF EXISTS "paiements_insert_perm" ON paiements;
CREATE POLICY "paiements_insert_perm" ON paiements FOR INSERT
    WITH CHECK (
      cabinet_id = get_my_cabinet_id()
      AND check_permission('can_record_payments')
    );

-- ┌──────────────────────────────────────────────────────────┐
-- │  5. CONTRAINTE MÉTIER — Empêcher les modules croisés      │
-- └──────────────────────────────────────────────────────────┘

-- Un huissier ne peut pas créer d'acte notarié
CREATE OR REPLACE FUNCTION check_profession_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profession TEXT;
BEGIN
  SELECT c.profession INTO v_profession
  FROM cabinets c
  JOIN profiles p ON p.cabinet_id = c.id
  WHERE p.id = auth.uid();

  -- Notary acts → notaire uniquement
  IF TG_TABLE_NAME = 'notary_acts' AND v_profession IS NOT NULL AND v_profession != 'notaire' THEN
    RAISE EXCEPTION 'Seul un cabinet de notaire peut créer des actes notariés.';
  END IF;

  -- Bailiff reports → commissaire/huissier uniquement
  IF TG_TABLE_NAME = 'bailiff_reports' AND v_profession IS NOT NULL
     AND v_profession NOT IN ('commissaire_justice', 'huissier') THEN
    RAISE EXCEPTION 'Seul un cabinet d''huissier/commissaire peut créer des constats.';
  END IF;

  -- Time entries → avocat uniquement
  IF TG_TABLE_NAME = 'time_entries' AND v_profession IS NOT NULL AND v_profession != 'avocat' THEN
    RAISE EXCEPTION 'Seul un cabinet d''avocat peut saisir des entrées de temps.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_notary_profession ON notary_acts;
CREATE TRIGGER check_notary_profession BEFORE INSERT ON notary_acts
    FOR EACH ROW EXECUTE FUNCTION check_profession_match();

DROP TRIGGER IF EXISTS check_bailiff_profession ON bailiff_reports;
CREATE TRIGGER check_bailiff_profession BEFORE INSERT ON bailiff_reports
    FOR EACH ROW EXECUTE FUNCTION check_profession_match();

DROP TRIGGER IF EXISTS check_avocat_profession ON time_entries;
CREATE TRIGGER check_avocat_profession BEFORE INSERT ON time_entries
    FOR EACH ROW EXECUTE FUNCTION check_profession_match();

-- ┌──────────────────────────────────────────────────────────┐
-- │  6. BLOCAGE COMPTES INACTIFS au niveau RLS                │
-- └──────────────────────────────────────────────────────────┘

-- Modifier get_my_cabinet_id pour retourner NULL si compte inactif
CREATE OR REPLACE FUNCTION get_my_cabinet_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cabinet_id FROM public.profiles
  WHERE id = auth.uid() AND active = true;
$$;

-- ============================================================
-- RÉSUMÉ DES CORRECTIONS DE SÉCURITÉ
-- ============================================================
-- 1. get_my_cabinet_id() : SET search_path = public + vérif active
-- 2. role_permissions   : table RBAC granulaire (20+ permissions)
-- 3. seed_defaults      : permissions par défaut pour 5 rôles
-- 4. check_permission() : helper SQL pour vérifier un droit
-- 5. RLS renforcé       : INSERT/DELETE conditionnés par permissions
-- 6. check_profession   : trigger empêchant les modules croisés
-- 7. Comptes inactifs   : bloqués au niveau RLS (get_my_cabinet_id)
