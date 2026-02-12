// ============================================================
// NumaLex — Requêtes complémentaires
// Clients (pour le select du formulaire) et Matter by ID
// ============================================================

import { createClient } from '@/lib/supabase/server';
import type { Client, Matter } from '@/types';

/**
 * Récupère la liste des clients du cabinet (pour les <select>).
 * Retourne uniquement id + full_name pour un payload léger.
 */
export async function fetchCabinetClients(): Promise<Pick<Client, 'id' | 'full_name'>[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('clients')
    .select('id, full_name')
    .order('full_name', { ascending: true });

  if (error) {
    throw new Error(`Erreur chargement clients : ${error.message}`);
  }

  return data ?? [];
}

/**
 * Récupère un dossier par son ID.
 * Le RLS garantit déjà le cloisonnement, mais on vérifie
 * explicitement le cabinet_id pour la double sécurité.
 */
export async function fetchMatterById(
  matterId: string,
  cabinetId: string
): Promise<Matter | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('matters')
    .select(
      `
      *,
      client:clients!matters_client_id_fkey ( id, full_name ),
      assignee:profiles!matters_assigned_to_fkey ( id, full_name )
    `
    )
    .eq('id', matterId)
    .eq('cabinet_id', cabinetId)
    .single();

  if (error) {
    // PGRST116 = no rows found — pas une erreur serveur
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erreur chargement dossier : ${error.message}`);
  }

  return data as Matter;
}
