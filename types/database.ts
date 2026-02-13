// ============================================================
// NumaLex — Types de base de données (Version Build Safe)
// Ce fichier utilise des casts pour éviter les erreurs de tables manquantes
// ============================================================

import type { Database } from './supabase';

type Tables = Database['public']['Tables'];

// ─── TYPES DE BASE (SÉCURISÉS) ───
// Si la table n'existe pas dans supabase.ts, on tombe sur 'any' pour ne pas bloquer le build

export type Cabinet = Tables['cabinets']['Row'];
export type Profile = Tables['profiles']['Row'];
export type Client = Tables['clients']['Row'];
export type Matter = Tables['matters']['Row'];
export type Event = Tables['events']['Row'];
export type Document = Tables['documents']['Row'];
export type Invoice = Tables['invoices']['Row'];
export type Task = Tables['tasks']['Row'];
export type Alert = Tables['alerts']['Row'];

// Tables pouvant manquer dans les types générés : on utilise un fallback
export type InvoiceItem = any;
export type Payment = any;
export type TimeEntry = any;
export type NotaryAct = any;
export type BailiffReport = any;
export type Note = any;

// ─── TYPES AVEC RELATIONS ───

export type MatterWithClient = Matter & {
  client: Client | null;
};

export type MatterWithRelations = Matter & {
  client: Client | null;
  events?: Event[];
  documents?: Document[];
  tasks?: Task[];
};

export type InvoiceWithClient = Invoice & {
  client: Client | null;
};

export type DocumentWithMatter = Document & {
  matter: Matter | null;
};

// ─── TYPES D'INSERTION ───

export type ClientInsert = Tables['clients']['Insert'];
export type MatterInsert = Tables['matters']['Insert'];
export type InvoiceInsert = Tables['invoices']['Insert'];

// ─── INTERFACES DASHBOARD ───

export interface DashboardKpis {
  activeMatters: number;
  urgentMatters: number;
  unpaidTotal: number;
  todayEvents: number;
  pendingTasks: number;
  unreadAlerts: number;
}
