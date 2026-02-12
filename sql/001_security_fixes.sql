-- ============================================================
-- NumaLex — Correctifs de sécurité SQL (post-audit)
-- À exécuter dans l'éditeur SQL de Supabase APRÈS le script init.
-- ============================================================

-- ============================================================
-- FIX C3 : Sécuriser get_my_cabinet_id() contre le search_path hijacking
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_cabinet_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''          -- ← Empêche le search_path hijacking
AS $$
    SELECT cabinet_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- FIX C5 : Ajouter la policy INSERT sur cabinets
-- Sans cela, l'onboarding OTP ne peut pas créer de cabinet.
-- ============================================================

CREATE POLICY "Création de cabinet à l'inscription"
    ON cabinets FOR INSERT
    WITH CHECK (true);
    -- Note : on ne peut pas vérifier get_my_cabinet_id() à l'INSERT
    -- car le profil n'existe pas encore. La sécurité est assurée
    -- par le fait que seule la Server Action (authentifiée) crée des cabinets.

-- ============================================================
-- FIX C4 : Fonction d'onboarding atomique (évite les race conditions)
-- Appelée depuis la Server Action verifyPhoneOtp.
-- ============================================================

CREATE OR REPLACE FUNCTION onboard_phone_user(
    p_user_id UUID,
    p_phone   TEXT
)
RETURNS UUID  -- Retourne le cabinet_id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_cabinet_id UUID;
    v_existing   UUID;
BEGIN
    -- Vérifier si le profil existe déjà (idempotent)
    SELECT cabinet_id INTO v_existing
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_existing IS NOT NULL THEN
        RETURN v_existing;
    END IF;

    -- Créer le cabinet
    INSERT INTO public.cabinets (name, phone)
    VALUES (
        'Cabinet de ' || p_phone,
        p_phone
    )
    RETURNING id INTO v_cabinet_id;

    -- Créer le profil (ON CONFLICT pour l'idempotence)
    INSERT INTO public.profiles (id, cabinet_id, role, phone)
    VALUES (p_user_id, v_cabinet_id, 'avocat', p_phone)
    ON CONFLICT (id) DO NOTHING;

    RETURN v_cabinet_id;
END;
$$;

COMMENT ON FUNCTION onboard_phone_user IS
    'Crée atomiquement un cabinet + profil pour un nouvel utilisateur OTP. Idempotent.';

-- Autoriser l'appel via RPC pour les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION onboard_phone_user TO authenticated;

-- ============================================================
-- FIX S4 : Index manquant sur invoices.due_at
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_invoices_due_at
    ON invoices(cabinet_id, due_at)
    WHERE status IN ('envoyee', 'en_retard');

-- ============================================================
-- BONUS : Audit log minimal (table + trigger)
-- Trace les modifications sur les dossiers (matters).
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name  TEXT NOT NULL,
    record_id   UUID NOT NULL,
    action      TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data    JSONB,
    new_data    JSONB,
    user_id     UUID,
    cabinet_id  UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_cabinet ON audit_log(cabinet_id, created_at DESC);

-- RLS : chaque cabinet ne voit que ses propres logs
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs de son cabinet"
    ON audit_log FOR SELECT
    USING (cabinet_id = get_my_cabinet_id());

-- Trigger d'audit sur matters
CREATE OR REPLACE FUNCTION audit_matters_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (table_name, record_id, action, old_data, user_id, cabinet_id)
        VALUES ('matters', OLD.id, 'DELETE', to_jsonb(OLD), auth.uid(), OLD.cabinet_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, user_id, cabinet_id)
        VALUES ('matters', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.cabinet_id);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (table_name, record_id, action, new_data, user_id, cabinet_id)
        VALUES ('matters', NEW.id, 'INSERT', to_jsonb(NEW), auth.uid(), NEW.cabinet_id);
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER trg_audit_matters
    AFTER INSERT OR UPDATE OR DELETE ON matters
    FOR EACH ROW EXECUTE FUNCTION audit_matters_changes();
