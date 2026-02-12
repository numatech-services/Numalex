-- ============================================================
-- NumaLex — Migration 002 : Tasks & Alerts
-- Exécuter après 000_init.sql et 001_security_fixes.sql
-- ============================================================

-- ─── TASKS (Tâches liées aux dossiers) ───

CREATE TABLE IF NOT EXISTS tasks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    matter_id    UUID REFERENCES matters(id) ON DELETE CASCADE,
    assigned_to  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title        TEXT NOT NULL,
    description  TEXT,
    due_date     DATE,
    priority     TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('basse', 'normal', 'haute', 'urgente')),
    completed    BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE tasks IS 'Tâches liées aux dossiers du cabinet';

CREATE INDEX idx_tasks_cabinet    ON tasks(cabinet_id);
CREATE INDEX idx_tasks_matter     ON tasks(matter_id);
CREATE INDEX idx_tasks_due        ON tasks(cabinet_id, due_date) WHERE NOT completed;
CREATE INDEX idx_tasks_assigned   ON tasks(assigned_to) WHERE NOT completed;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres du cabinet : lecture tâches"
    ON tasks FOR SELECT
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Membres du cabinet : insertion tâches"
    ON tasks FOR INSERT
    WITH CHECK (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Membres du cabinet : modification tâches"
    ON tasks FOR UPDATE
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Membres du cabinet : suppression tâches"
    ON tasks FOR DELETE
    USING (cabinet_id = get_my_cabinet_id());

-- Trigger updated_at
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- ─── ALERTS (Alertes automatiques + manuelles) ───

CREATE TABLE IF NOT EXISTS alerts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabinet_id   UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
    matter_id    UUID REFERENCES matters(id) ON DELETE SET NULL,
    invoice_id   UUID REFERENCES invoices(id) ON DELETE SET NULL,
    message      TEXT NOT NULL,
    level        TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warning', 'critical')),
    read         BOOLEAN NOT NULL DEFAULT false,
    read_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE alerts IS 'Alertes : factures impayées, audiences proches, dossiers inactifs';

CREATE INDEX idx_alerts_cabinet  ON alerts(cabinet_id);
CREATE INDEX idx_alerts_user     ON alerts(user_id, read);
CREATE INDEX idx_alerts_unread   ON alerts(cabinet_id, read) WHERE NOT read;

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres du cabinet : lecture alertes"
    ON alerts FOR SELECT
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Membres du cabinet : insertion alertes"
    ON alerts FOR INSERT
    WITH CHECK (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Membres du cabinet : modification alertes"
    ON alerts FOR UPDATE
    USING (cabinet_id = get_my_cabinet_id());

CREATE POLICY "Membres du cabinet : suppression alertes"
    ON alerts FOR DELETE
    USING (cabinet_id = get_my_cabinet_id());

-- ============================================================
-- Fonction : Générer des alertes automatiques
-- Appeler via un Edge Function cron ou manuellement
-- ============================================================

CREATE OR REPLACE FUNCTION generate_cabinet_alerts(p_cabinet_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  alert_count INT := 0;
BEGIN
  -- 1. Factures impayées (échéance dépassée)
  INSERT INTO public.alerts (cabinet_id, matter_id, invoice_id, message, level)
  SELECT
    i.cabinet_id,
    i.matter_id,
    i.id,
    'Facture ' || i.invoice_number || ' impayée — échéance ' ||
      to_char(i.due_at, 'DD/MM/YYYY'),
    'critical'
  FROM public.invoices i
  WHERE i.cabinet_id = p_cabinet_id
    AND i.status NOT IN ('payee', 'annulee')
    AND i.due_at < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.alerts a
      WHERE a.invoice_id = i.id AND a.level = 'critical'
        AND a.created_at > CURRENT_DATE - INTERVAL '7 days'
    );
  GET DIAGNOSTICS alert_count = ROW_COUNT;

  -- 2. Audiences dans les 48h
  INSERT INTO public.alerts (cabinet_id, matter_id, message, level)
  SELECT
    e.cabinet_id,
    e.matter_id,
    'Audience « ' || e.title || ' » le ' ||
      to_char(e.starts_at AT TIME ZONE 'Africa/Niamey', 'DD/MM à HH24:MI'),
    'warning'
  FROM public.events e
  WHERE e.cabinet_id = p_cabinet_id
    AND e.event_type = 'audience'
    AND e.starts_at BETWEEN now() AND now() + INTERVAL '48 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.alerts a
      WHERE a.matter_id = e.matter_id AND a.level = 'warning'
        AND a.message LIKE '%' || e.title || '%'
        AND a.created_at > CURRENT_DATE - INTERVAL '2 days'
    );

  -- 3. Dossiers inactifs depuis 30 jours
  INSERT INTO public.alerts (cabinet_id, matter_id, message, level)
  SELECT
    m.cabinet_id,
    m.id,
    'Dossier « ' || m.title || ' » inactif depuis plus de 30 jours',
    'info'
  FROM public.matters m
  WHERE m.cabinet_id = p_cabinet_id
    AND m.status NOT IN ('cloture', 'archive')
    AND m.updated_at < now() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.alerts a
      WHERE a.matter_id = m.id AND a.level = 'info'
        AND a.created_at > CURRENT_DATE - INTERVAL '30 days'
    );

  RETURN alert_count;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_cabinet_alerts(UUID) TO authenticated;
