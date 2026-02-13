'use server';

import { bailiffReportSchema, validateInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function upsertBailiffReport(data: {
  id?: string; matter_id?: string; client_id?: string; report_type: string;
  report_number?: string; title: string; location?: string;
  gps_lat?: number; gps_lng?: number; description?: string;
  report_date?: string; served?: boolean; served_to?: string; fees?: number;
}) {
  const validated = validateInput(bailiffReportSchema, data);
  if (!validated.success) return { success: false, error: validated.error };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Session expirée.' };

  // Correction : Cast 'any' pour éviter l'erreur de propriété sur 'profile'
  const { data: profile }: { data: any } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Profil introuvable.' };

  const payload = {
    cabinet_id: profile.cabinet_id,
    matter_id: data.matter_id || null,
    client_id: data.client_id || null,
    report_type: data.report_type,
    report_number: data.report_number || null,
    title: data.title,
    location: data.location || null,
    gps_lat: data.gps_lat ?? null,
    gps_lng: data.gps_lng ?? null,
    description: data.description || null,
    report_date: data.report_date || new Date().toISOString().split('T')[0],
    served: data.served ?? false,
    served_at: data.served ? new Date().toISOString() : null,
    served_to: data.served_to || null,
    fees: data.fees ?? null,
    ...(data.id ? {} : { created_by: user.id }),
  };

  if (data.id) {
    // Correction : Cast 'as any' pour autoriser l'update
    const { error } = await (supabase.from('bailiff_reports') as any)
      .update(payload)
      .eq('id', data.id);
    if (error) return { success: false, error: error.message };
  } else {
    // Correction : Cast 'as any' pour autoriser l'insert
    const { error } = await (supabase.from('bailiff_reports') as any)
      .insert(payload);
    if (error) return { success: false, error: error.message };
  }
  
  revalidatePath('/dashboard/constats');
  return { success: true };
}

export async function deleteBailiffReport(id: string) {
  const supabase = createClient();
  // Correction : Cast 'as any' ici aussi par précaution
  await (supabase.from('bailiff_reports') as any).delete().eq('id', id);
  revalidatePath('/dashboard/constats');
  redirect('/dashboard/constats');
}
