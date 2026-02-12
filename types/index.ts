// ============================================================
// NumaLex — Types TypeScript
// ============================================================

export type UserRole = 'avocat' | 'huissier' | 'notaire';

export type MatterStatus = 'ouvert' | 'en_cours' | 'suspendu' | 'clos' | 'archive';

export interface Profile {
  id: string;
  cabinet_id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface Client {
  id: string;
  full_name: string;
  client_type: 'physique' | 'morale';
  phone: string | null;
  email: string | null;
}

export interface Matter {
  id: string;
  cabinet_id: string;
  client_id: string | null;
  reference: string | null;
  title: string;
  description: string | null;
  status: MatterStatus;
  juridiction: string | null;
  parties_adverses: string | null;
  assigned_to: string | null;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  client?: Pick<Client, 'id' | 'full_name'> | null;
  assignee?: Pick<Profile, 'id' | 'full_name'> | null;
  // Champ spécifique huissier (ajouté en extension)
  date_signification?: string | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MattersPageSearchParams {
  page?: string;
  status?: MatterStatus;
  q?: string;
}
