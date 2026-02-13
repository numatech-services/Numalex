'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { eventSchema, type EventFormValues } from '@/lib/validators/event';

interface ActionSuccess { success: true; eventId: string; }
interface ActionError { success: false; error: string; fieldErrors?: Record<string, string[]>; }
export type EventActionResult = ActionSuccess | ActionError;

export async function upsertEvent(formData: EventFormValues): Promise<EventActionResult> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Session expirée.' };

  // Correction : Cast 'any' pour forcer TypeScript à accepter l'existence de cabinet_id
  const { data: profile }: { data: any } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Profil introuvable.' };

  const parsed = eventSchema.safeParse(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { success: false, error: 'Données invalides.', fieldErrors };
  }

  const { id, ...fields } = parsed.data;
  const payload = {
    title: fields.title,
    event_type: fields.event_type,
    starts_at: fields.starts_at,
    ends_at: fields.ends_at || null,
    location: fields.location || null,
    description: fields.description || null,
    matter_id: fields.matter_id || null,
    cabinet_id: profile.cabinet_id,
    ...(id ? {} : { created_by: user.id }),
  };

  if (id) {
    const { data: existing } = await supabase.from('events').select('id').eq('id', id).eq('cabinet_id', profile.cabinet_id).single();
    if (!existing) return { success: false, error: 'Événement introuvable.' };

    // Correction : Cast 'as any' pour l'accès à la table 'events'
    const { error } = await (supabase.from('events') as any).update(payload).eq('id', id);
    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/agenda');
    return { success: true, eventId: id };
  } else {
    // Correction : Cast 'as any' pour l'insertion
    const { data: newEvent, error } = await (supabase.from('events') as any).insert(payload).select('id').single();
    if (error || !newEvent) return { success: false, error: error?.message ?? 'Erreur inconnue' };

    revalidatePath('/dashboard/agenda');
    return { success: true, eventId: newEvent.id };
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié.');

  const { data: profile }: { data: any } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single();
  if (!profile) throw new Error('Profil introuvable.');

  // Correction : Cast 'as any' pour la suppression sécurisée
  const { error } = await (supabase.from('events') as any).delete().eq('id', eventId).eq('cabinet_id', profile.cabinet_id);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/agenda');
  redirect('/dashboard/agenda');
}
