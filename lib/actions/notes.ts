'use server';

import { z } from 'zod';
const noteSchema = z.object({ dossier_id: z.string().uuid(), contenu: z.string().min(1, 'Contenu obligatoire').max(10000) });

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addNote(data: { dossier_id: string; contenu: string }) {
  const parsed = noteSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Données invalides" };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Session expirée.' };

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single();
  if (!profile) return { success: false, error: 'Profil introuvable.' };

  if (!data.contenu.trim()) return { success: false, error: 'Le contenu est obligatoire.' };

  const { error } = await supabase.from('notes_privees').insert({
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
  const { error } = await supabase.from('notes_privees').delete().eq('id', noteId);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/dossiers/${dossierId}`);
  return { success: true };
}

export async function fetchNotes(dossierId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('notes_privees')
    .select('id, contenu, created_at, auteur:profiles!notes_privees_auteur_id_fkey(full_name)')
    .eq('dossier_id', dossierId)
    .order('created_at', { ascending: false });
  return data ?? [];
}
