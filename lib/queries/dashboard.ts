// ============================================================
// NumaLex — Queries Dashboard
// TOUTES les requêtes filtrent explicitement par cabinet_id.
// ============================================================

import { createClient } from '@/lib/supabase/server';

export interface DashboardKpis {
  activeMatters: number;
  urgentMatters: number;
  unpaidTotal: number;
  todayEvents: number;
  pendingTasks: number;
  unreadAlerts: number;
}

export async function fetchDashboardKpis(cabinetId: string): Promise<DashboardKpis> {
  const supabase = createClient();

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const [matters, urgent, unpaid, events, tasks, alerts] = await Promise.all([
    supabase.from('matters').select('id', { count: 'exact', head: true })
      .eq('cabinet_id', cabinetId)
      .not('status', 'in', '("cloture","archive","termine")'),

    supabase.from('matters').select('id', { count: 'exact', head: true })
      .eq('cabinet_id', cabinetId)
      .eq('status', 'contentieux'),

    supabase.from('invoices').select('total_ttc')
      .eq('cabinet_id', cabinetId)
      .not('status', 'in', '("payee","annulee")'),

    supabase.from('events').select('id', { count: 'exact', head: true })
      .eq('cabinet_id', cabinetId)
      .gte('starts_at', startOfDay).lt('starts_at', endOfDay),

    supabase.from('tasks').select('id', { count: 'exact', head: true })
      .eq('cabinet_id', cabinetId)
      .eq('completed', false),

    supabase.from('alerts').select('id', { count: 'exact', head: true })
      .eq('cabinet_id', cabinetId)
      .eq('read', false),
  ]);

  const unpaidTotal = (unpaid.data ?? []).reduce((sum, inv) => sum + (inv.total_ttc ?? 0), 0);

  return {
    activeMatters: matters.count ?? 0,
    urgentMatters: urgent.count ?? 0,
    unpaidTotal,
    todayEvents: events.count ?? 0,
    pendingTasks: tasks.count ?? 0,
    unreadAlerts: alerts.count ?? 0,
  };
}

export async function fetchRecentMatters(cabinetId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('matters')
    .select('id, title, status, reference, client:clients!matters_client_id_fkey(full_name), updated_at')
    .eq('cabinet_id', cabinetId)
    .order('updated_at', { ascending: false })
    .limit(5);
  return data ?? [];
}

export async function fetchTodayEvents(cabinetId: string) {
  const supabase = createClient();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data } = await supabase
    .from('events')
    .select('id, title, event_type, starts_at, ends_at, location')
    .eq('cabinet_id', cabinetId)
    .gte('starts_at', startOfDay)
    .lt('starts_at', endOfDay)
    .order('starts_at', { ascending: true })
    .limit(8);
  return data ?? [];
}

export async function fetchRecentAlerts(cabinetId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('alerts')
    .select('id, message, level, read, created_at, matter:matters!alerts_matter_id_fkey(id,title)')
    .eq('cabinet_id', cabinetId)
    .order('created_at', { ascending: false })
    .limit(8);
  return data ?? [];
}

export async function fetchPendingTasks(cabinetId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('tasks')
    .select('id, title, due_date, priority, completed, matter:matters!tasks_matter_id_fkey(id,title)')
    .eq('cabinet_id', cabinetId)
    .eq('completed', false)
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(8);
  return data ?? [];
}

export async function fetchRecentDocuments(cabinetId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('documents')
    .select('id, title, doc_type, file_url, file_size, created_at, matter:matters!documents_matter_id_fkey(id,title)')
    .eq('cabinet_id', cabinetId)
    .order('created_at', { ascending: false })
    .limit(5);
  return data ?? [];
}
