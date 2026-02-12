// ============================================================
// NumaLex — Repository Layer
// Couche d'accès données centralisée.
// - Toutes les requêtes passent par ici
// - Filtrage cabinet_id AUTOMATIQUE
// - Vérification permissions intégrée
// ============================================================

import { createClient } from '@/lib/supabase/server';

export type Permission =
  | 'can_view_matters' | 'can_create_matters' | 'can_edit_matters' | 'can_delete_matters'
  | 'can_view_clients' | 'can_create_clients' | 'can_edit_clients' | 'can_delete_clients'
  | 'can_view_documents' | 'can_upload_documents' | 'can_delete_documents'
  | 'can_view_invoices' | 'can_create_invoices' | 'can_edit_invoices' | 'can_record_payments'
  | 'can_view_events' | 'can_create_events' | 'can_edit_events'
  | 'can_view_tasks' | 'can_create_tasks' | 'can_edit_tasks'
  | 'can_manage_users' | 'can_view_audit' | 'can_manage_settings';

export interface SessionContext {
  userId: string;
  cabinetId: string;
  role: string;        // user_role (avocat, notaire, huissier)
  rbacRole: string;    // rbac_role (admin, associe, collaborateur, secretariat, lecture)
  fullName: string;
}

// ─── Récupérer le contexte de session avec vérification ───

export async function getSessionContext(): Promise<SessionContext> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('NOT_AUTHENTICATED');

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id, role, rbac_role, full_name, active')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  if (profile.active === false) throw new Error('ACCOUNT_DISABLED');

  return {
    userId: user.id,
    cabinetId: profile.cabinet_id,
    role: profile.role,
    rbacRole: profile.rbac_role ?? 'collaborateur',
    fullName: profile.full_name ?? '',
  };
}

// ─── Vérifier une permission côté applicatif ───

export async function hasPermission(ctx: SessionContext, permission: Permission): Promise<boolean> {
  // Admin a toujours tous les droits
  if (ctx.rbacRole === 'admin') return true;

  const supabase = createClient();
  const { data } = await supabase
    .from('role_permissions')
    .select(permission)
    .eq('cabinet_id', ctx.cabinetId)
    .eq('rbac_role', ctx.rbacRole)
    .single();

  return data?.[permission] === true;
}

// Lancer une erreur si permission refusée
export async function requirePermission(ctx: SessionContext, permission: Permission): Promise<void> {
  const allowed = await hasPermission(ctx, permission);
  if (!allowed) {
    throw new Error(`PERMISSION_DENIED: ${permission} non autorisé pour le rôle ${ctx.rbacRole}`);
  }
}

// ─── Repositories typés par table ───

export function createRepository(ctx: SessionContext) {
  const supabase = createClient();

  return {
    // ═══ MATTERS ═══
    matters: {
      async list(options?: { status?: string; search?: string; limit?: number; offset?: number }) {
        let q = supabase.from('matters')
          .select('*, client:clients!matters_client_id_fkey(id, full_name)', { count: 'exact' })
          .eq('cabinet_id', ctx.cabinetId)
          .order('updated_at', { ascending: false });

        if (options?.status) q = q.eq('status', options.status);
        if (options?.search) q = q.or(`title.ilike.%${options.search}%,reference.ilike.%${options.search}%`);
        if (options?.limit) q = q.limit(options.limit);
        if (options?.offset) q = q.range(options.offset, options.offset + (options.limit ?? 20) - 1);

        return q;
      },

      async getById(id: string) {
        return supabase.from('matters')
          .select('*, client:clients!matters_client_id_fkey(*)')
          .eq('id', id)
          .eq('cabinet_id', ctx.cabinetId)
          .single();
      },

      async create(data: Record<string, any>) {
        await requirePermission(ctx, 'can_create_matters');
        return supabase.from('matters').insert({ ...data, cabinet_id: ctx.cabinetId, created_by: ctx.userId });
      },

      async update(id: string, data: Record<string, any>) {
        await requirePermission(ctx, 'can_edit_matters');
        return supabase.from('matters').update(data).eq('id', id).eq('cabinet_id', ctx.cabinetId);
      },

      async delete(id: string) {
        await requirePermission(ctx, 'can_delete_matters');
        return supabase.from('matters').delete().eq('id', id).eq('cabinet_id', ctx.cabinetId);
      },
    },

    // ═══ CLIENTS ═══
    clients: {
      async list() {
        return supabase.from('clients').select('*').eq('cabinet_id', ctx.cabinetId).order('full_name');
      },

      async getById(id: string) {
        return supabase.from('clients').select('*').eq('id', id).eq('cabinet_id', ctx.cabinetId).single();
      },

      async create(data: Record<string, any>) {
        await requirePermission(ctx, 'can_create_clients');
        return supabase.from('clients').insert({ ...data, cabinet_id: ctx.cabinetId });
      },

      async update(id: string, data: Record<string, any>) {
        await requirePermission(ctx, 'can_edit_clients');
        return supabase.from('clients').update(data).eq('id', id).eq('cabinet_id', ctx.cabinetId);
      },

      async delete(id: string) {
        await requirePermission(ctx, 'can_delete_clients');
        return supabase.from('clients').delete().eq('id', id).eq('cabinet_id', ctx.cabinetId);
      },
    },

    // ═══ EVENTS ═══
    events: {
      async list(options?: { from?: string; to?: string }) {
        let q = supabase.from('events').select('*').eq('cabinet_id', ctx.cabinetId).order('starts_at');
        if (options?.from) q = q.gte('starts_at', options.from);
        if (options?.to) q = q.lt('starts_at', options.to);
        return q;
      },

      async create(data: Record<string, any>) {
        await requirePermission(ctx, 'can_create_events');
        return supabase.from('events').insert({ ...data, cabinet_id: ctx.cabinetId, created_by: ctx.userId });
      },
    },

    // ═══ INVOICES ═══
    invoices: {
      async list() {
        return supabase.from('invoices').select('*').eq('cabinet_id', ctx.cabinetId).order('created_at', { ascending: false });
      },

      async getById(id: string) {
        return supabase.from('invoices').select('*').eq('id', id).eq('cabinet_id', ctx.cabinetId).single();
      },

      async create(data: Record<string, any>) {
        await requirePermission(ctx, 'can_create_invoices');
        return supabase.from('invoices').insert({ ...data, cabinet_id: ctx.cabinetId, issued_by: ctx.userId });
      },
    },

    // ═══ DOCUMENTS ═══
    documents: {
      async list(matterId?: string) {
        let q = supabase.from('documents').select('*').eq('cabinet_id', ctx.cabinetId).order('created_at', { ascending: false });
        if (matterId) q = q.eq('matter_id', matterId);
        return q;
      },
    },

    // ═══ TASKS ═══
    tasks: {
      async listPending() {
        return supabase.from('tasks').select('*').eq('cabinet_id', ctx.cabinetId).eq('completed', false).order('due_date');
      },
    },

    // ═══ ALERTS ═══
    alerts: {
      async listUnread() {
        return supabase.from('alerts').select('*').eq('cabinet_id', ctx.cabinetId).eq('read', false).order('created_at', { ascending: false });
      },
    },

    // ═══ RAW (pour des requêtes custom) ═══
    raw: supabase,
    ctx,
  };
}
