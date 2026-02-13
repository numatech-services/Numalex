// ============================================================
// NumaLex — Types de base de données (Version Ultra Build Safe)
// ============================================================

import type { Database } from './supabase';

type Tables = Database['public']['Tables'];

// ─── TYPES DE BASE (SÉCURISÉS AVEC FALLBACK) ───

// On vérifie si la table existe, sinon on utilise 'any'
export type Cabinet = Tables extends { cabinets: any } ? Tables['cabinets']['Row'] : any;
export type Profile = Tables extends { profiles: any } ? Tables['profiles']['Row'] : any;
export type Client = Tables extends { clients: any } ? Tables['clients']['Row'] : any;
export type Matter = Tables extends { matters: any } ? Tables['matters']['Row'] : any;
export type Event = Tables extends { events: any } ? Tables['events']['Row'] : any;
export type Document = Tables extends { documents: any } ? Tables['documents']['Row'] : any;
export type Invoice = Tables extends { invoices: any } ? Tables['invoices']['Row'] : any;

// Tables souvent absentes des types générés
export type Task = any;
export type Alert = any;
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

export type ClientInsert = Tables extends { clients: any } ? Tables['clients']['Insert'] : any;
export type MatterInsert = Tables extends { matters: any } ? Tables['matters']['Insert'] : any;
export type InvoiceInsert = Tables extends { invoices: any } ? Tables['invoices']['Insert'] : any;

// ─── INTERFACES DASHBOARD ───

export interface DashboardKpis {
  activeMatters: number;
  urgentMatters: number;
  unpaidTotal: number;
  todayEvents: number;
  pendingTasks: number;
  unreadAlerts: number;
}
