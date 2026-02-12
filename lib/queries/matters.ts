// ============================================================
// NumaLex — Couche d'accès aux données : Dossiers (Matters)
//
// FIX C2 : Sanitisation du paramètre `search` pour empêcher
//          l'injection de filtres PostgREST via .or().
// ============================================================

import { createClient } from '@/lib/supabase/server';
import type { Matter, MatterStatus, PaginationMeta, Profile } from '@/types';

const PAGE_SIZE = 10;

interface FetchMattersParams {
  page: number;
  status?: MatterStatus;
  search?: string;
}

interface FetchMattersResult {
  matters: Matter[];
  pagination: PaginationMeta;
}

/**
 * Échappe les caractères spéciaux PostgREST pour éviter l'injection de filtres.
 * Les caractères dangereux dans un contexte `.or()` sont : , . ( ) % _
 * On échappe % et _ (wildcards LIKE) et on supprime les virgules/points
 * qui pourraient casser la syntaxe du filtre.
 */
function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,()]/g, '')      // Supprime les délimiteurs PostgREST
    .replace(/\\/g, '\\\\')     // Échappe les backslashes
    .replace(/%/g, '\\%')       // Échappe le wildcard %
    .replace(/_/g, '\\_')       // Échappe le wildcard _
    .trim()
    .slice(0, 100);             // Limite la longueur
}

/**
 * Récupère les dossiers paginés pour le cabinet de l'utilisateur connecté.
 * Le RLS Supabase garantit le cloisonnement par cabinet.
 */
export async function fetchMatters({
  page,
  status,
  search,
}: FetchMattersParams): Promise<FetchMattersResult> {
  const supabase = createClient();

  // ---- Requête de base avec jointures ----
  let query = supabase
    .from('matters')
    .select(
      `
      *,
      client:clients!matters_client_id_fkey ( id, full_name ),
      assignee:profiles!matters_assigned_to_fkey ( id, full_name )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  // ---- Filtres optionnels ----
  if (status) {
    query = query.eq('status', status);
  }

  if (search && search.trim()) {
    // FIX C2 : Sanitiser l'input avant de l'injecter dans le filtre
    const safe = sanitizeSearch(search);
    if (safe.length > 0) {
      query = query.or(
        `title.ilike.%${safe}%,reference.ilike.%${safe}%,parties_adverses.ilike.%${safe}%`
      );
    }
  }

  // ---- Pagination ----
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erreur chargement dossiers : ${error.message}`);
  }

  const total = count ?? 0;

  return {
    matters: (data as Matter[]) ?? [],
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  };
}

/**
 * Récupère le profil de l'utilisateur connecté.
 */
export async function fetchCurrentProfile(): Promise<Profile> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Utilisateur non authentifié');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, cabinet_id, role, full_name, phone, avatar_url')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    throw new Error(`Profil introuvable : ${error?.message ?? 'aucune donnée'}`);
  }

  return data as Profile;
}
