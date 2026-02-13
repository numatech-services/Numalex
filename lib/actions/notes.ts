'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const noteSchema = z.object({ 
  dossier_id: z.string().uuid(), 
  contenu: z.string().min(1, 'Contenu obligatoire').max(10000) 
});

export async function addNote(data: { dossier_id: string; contenu: string }) {
  const parsed = noteSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Données invalides" };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Session expirée.' };

  // Correction : Typage explicite 'any' pour éviter l'erreur 'never' sur cabinet_id
  const { data: profile }: { data: any } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Profil introuvable.' };
  if (!data.contenu.trim()) return { success: false, error: 'Le contenu est obligatoire.' };

  // Correction CRUCIALE : cast 'as any' pour autoriser l'insertion dans la table
  const { error } = await (supabase.from('notes_privees') as any).insert({
    cabinet_id: profile.cabinet_id,
    dossier_id: data.dossier_id,
    auteur_id: user.id,
    contenu: data.contenu.trim(),
  });

  if (error) return { success: false, error: error.message };
  
  revalidatePath(`/dashboard/dossiers/${data.dossier_id}`);
  return { success: true };
}

export async function deleteNote(noteId: string, dossierId: string) {
  const supabase = createClient();
  // Correction : cast 'as any' pour la suppression
  const { error } = await (supabase.from('notes_privees') as any).delete().eq('id', noteId);
  
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/dossiers/${dossierId}`);
  return { success: true };
}

export async function fetchNotes(dossierId: string) {
  const supabase = createClient();
  // Correction : cast 'as any' pour la lecture
  const { data } = await (supabase.from('notes_privees') as any)
    .select('id, contenu, created_at, auteur:profiles!notes_privees_auteur_id_fkey(full_name)')
    .eq('dossier_id', dossierId)
    .order('created_at', { ascending: false });
    
  return data ?? [];
}
