'use server';

import { timeEntrySchema, validateInput } from '@/lib/validations';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function upsertTimeEntry(data: {
  id?: string; matter_id: string; minutes: number; description: string;
  entry_date: string; hourly_rate?: number; billable?: boolean;
}) {
  const validated = validateInput(timeEntrySchema, data);
  if (!validated.success) return { success: false, error: validated.error };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Session expirée.' };
  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single();
  if (!profile) return { success: false, error: 'Profil introuvable.' };

  const payload = {
    cabinet_id: profile.cabinet_id,
    matter_id: data.matter_id,
    user_id: user.id,
    minutes: data.minutes,
    description: data.description,
    entry_date: data.entry_date || new Date().toISOString().split('T')[0],
    hourly_rate: data.hourly_rate ?? null,
    billable: data.billable ?? true,
  };

  if (data.id) {
    const { error } = await supabase.from('time_entries').update(payload).eq('id', data.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from('time_entries').insert(payload);
    if (error) return { success: false, error: error.message };
  }
  revalidatePath('/dashboard/temps');
  return { success: true };
}

export async function deleteTimeEntry(id: string) {
  const supabase = createClient();
  await supabase.from('time_entries').delete().eq('id', id);
  revalidatePath('/dashboard/temps');
  redirect('/dashboard/temps');
}
