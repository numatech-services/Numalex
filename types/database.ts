// ============================================================
// NumaLex — Types de base de données avec relations
// Ce fichier corrige tous les types 'any' du projet
// ============================================================

import type { Database } from './supabase';

// ============================================================
// TYPES DE BASE (depuis Supabase)
// ============================================================

export type Cabinet = Database['public']['Tables']['cabinets']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Matter = Database['public']['Tables']['matters']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type Alert = Database['public']['Tables']['alerts']['Row'];
export type TimeEntry = Database['public']['Tables']['time_entries']['Row'];
export type NotaryAct = Database['public']['Tables']['notary_acts']['Row'];
export type BailiffReport = Database['public']['Tables']['bailiff_reports']['Row'];
export type Note = Database['public']['Tables']['private_notes']['Row'];

// ============================================================
// TYPES AVEC RELATIONS (pour Supabase joins)
// ============================================================

export type MatterWithClient = Matter & {
  client: Client | null;
};

export type MatterWithRelations = Matter & {
  client: Client | null;
  events?: Event[];
  documents?: Document[];
  tasks?: Task[];
  notes?: Note[];
};

export type InvoiceWithClient = Invoice & {
  client: Client | null;
};

export type InvoiceWithMatter = Invoice & {
  matter: Matter | null;
};

export type InvoiceWithRelations = Invoice & {
  client: Client | null;
  matter: Matter | null;
  items: InvoiceItem[];
  payments: Payment[];
};

export type DocumentWithMatter = Document & {
  matter: Matter | null;
};

export type DocumentWithRelations = Document & {
  matter: MatterWithClient | null;
  uploaded_by_profile?: Profile;
};

export type EventWithMatter = Event & {
  matter: Matter | null;
};

export type EventWithRelations = Event & {
  matter: MatterWithClient | null;
  created_by_profile?: Profile;
};

export type TimeEntryWithMatter = TimeEntry & {
  matter: Matter | null;
};

export type TimeEntryWithRelations = TimeEntry & {
  matter: MatterWithClient | null;
  user: Profile;
};

export type TaskWithMatter = Task & {
  matter: Matter | null;
};

export type TaskWithRelations = Task & {
  matter: MatterWithClient | null;
  assigned_to_profile?: Profile;
  created_by_profile?: Profile;
};

export type NotaryActWithClient = NotaryAct & {
  client: Client | null;
};

export type BailiffReportWithClient = BailiffReport & {
  client: Client | null;
};

// ============================================================
// TYPES D'INSERTION (pour les formulaires)
// ============================================================

export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type MatterInsert = Database['public']['Tables']['matters']['Insert'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
export type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TimeEntryInsert = Database['public']['Tables']['time_entries']['Insert'];
export type NotaryActInsert = Database['public']['Tables']['notary_acts']['Insert'];
export type BailiffReportInsert = Database['public']['Tables']['bailiff_reports']['Insert'];

// ============================================================
// TYPES DE MISE À JOUR
// ============================================================

export type ClientUpdate = Database['public']['Tables']['clients']['Update'];
export type MatterUpdate = Database['public']['Tables']['matters']['Update'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// ============================================================
// TYPES UTILITAIRES
// ============================================================

// Pour les listes paginées
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Pour les statistiques du dashboard
export interface DashboardStats {
  totalMatters: number;
  activeMatters: number;
  totalClients: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
  monthRevenue: number;
}

// Pour les filtres de recherche
export interface MatterFilters {
  status?: Matter['status'];
  search?: string;
  clientId?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface InvoiceFilters {
  status?: Invoice['status'];
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================
// TYPES POUR LES COMPOSANTS
// ============================================================

// Props du tableau de dossiers
export interface MattersTableData {
  matters: MatterWithClient[];
  count: number;
}

// Props du tableau de factures
export interface InvoicesTableData {
  invoices: InvoiceWithClient[];
  count: number;
}

// Props des widgets du dashboard
export interface DashboardData {
  stats: DashboardStats;
  recentMatters: MatterWithClient[];
  todayEvents: EventWithMatter[];
  alerts: Alert[];
  documents: DocumentWithMatter[];
  tasks: TaskWithMatter[];
}
