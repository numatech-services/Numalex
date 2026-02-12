// ============================================================
// NumaLex — Types Supabase (Database)
//
// FIX C7 : Ce fichier était importé mais n'existait pas.
//
// POUR LA PRODUCTION, régénérez ce fichier avec :
//   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
//
// Le stub ci-dessous permet au build de passer en attendant.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      cabinets: {
        Row: {
          id: string;
          name: string;
          nif: string | null;
          address: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          nif?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          nif?: string | null;
          address?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          cabinet_id: string;
          role: 'avocat' | 'huissier' | 'notaire';
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          cabinet_id: string;
          role?: 'avocat' | 'huissier' | 'notaire';
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          cabinet_id?: string;
          role?: 'avocat' | 'huissier' | 'notaire';
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
        };
      };
      clients: {
        Row: {
          id: string;
          cabinet_id: string;
          full_name: string;
          client_type: 'physique' | 'morale';
          phone: string | null;
          email: string | null;
          address: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cabinet_id: string;
          full_name: string;
          client_type?: 'physique' | 'morale';
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: {
          full_name?: string;
          client_type?: 'physique' | 'morale';
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
        };
      };
      matters: {
        Row: {
          id: string;
          cabinet_id: string;
          client_id: string | null;
          reference: string | null;
          title: string;
          description: string | null;
          status: 'ouvert' | 'en_cours' | 'suspendu' | 'clos' | 'archive';
          juridiction: string | null;
          parties_adverses: string | null;
          date_signification: string | null;
          assigned_to: string | null;
          opened_at: string | null;
          closed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cabinet_id: string;
          client_id?: string | null;
          reference?: string | null;
          title: string;
          description?: string | null;
          status?: 'ouvert' | 'en_cours' | 'suspendu' | 'clos' | 'archive';
          juridiction?: string | null;
          parties_adverses?: string | null;
          date_signification?: string | null;
          assigned_to?: string | null;
          opened_at?: string | null;
          closed_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          client_id?: string | null;
          title?: string;
          description?: string | null;
          status?: 'ouvert' | 'en_cours' | 'suspendu' | 'clos' | 'archive';
          juridiction?: string | null;
          parties_adverses?: string | null;
          date_signification?: string | null;
          assigned_to?: string | null;
          closed_at?: string | null;
        };
      };
      events: {
        Row: {
          id: string;
          cabinet_id: string;
          matter_id: string | null;
          title: string;
          event_type: 'audience' | 'rdv' | 'deadline' | 'autre';
          starts_at: string;
          ends_at: string | null;
          location: string | null;
          description: string | null;
          reminder_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      documents: {
        Row: {
          id: string;
          cabinet_id: string;
          matter_id: string | null;
          title: string;
          doc_type: string;
          file_url: string;
          file_size: number | null;
          mime_type: string | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      invoices: {
        Row: {
          id: string;
          cabinet_id: string;
          matter_id: string | null;
          client_id: string | null;
          invoice_number: string;
          amount_ht: number;
          tva_rate: number;
          tva_amount: number;
          total_ttc: number;
          status: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
          issued_at: string | null;
          due_at: string | null;
          paid_at: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      audit_log: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          action: 'INSERT' | 'UPDATE' | 'DELETE';
          old_data: Json | null;
          new_data: Json | null;
          user_id: string | null;
          cabinet_id: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      get_my_cabinet_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      onboard_phone_user: {
        Args: { p_user_id: string; p_phone: string };
        Returns: string;
      };
    };
    Enums: {
      user_role: 'avocat' | 'huissier' | 'notaire';
      client_type: 'physique' | 'morale';
      matter_status: 'ouvert' | 'en_cours' | 'suspendu' | 'clos' | 'archive';
      event_type: 'audience' | 'rdv' | 'deadline' | 'autre';
      document_type: 'assignation' | 'conclusions' | 'jugement' | 'contrat' | 'proces_verbal' | 'facture' | 'correspondance' | 'autre';
      invoice_status: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
    };
  };
}
