'use server';

import { notaryActSchema, validateInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function upsertNotaryAct(data: {
  id?: string; matter_id?: string; client_id?: string; act_type: string;
  act_number?: string; title: string; description?: string;
  act_date?: string; notary_fees?: number; tax_amount?: number; signed?: boolean;
}) {
  const validated = validateInput(notaryActSchema, data);
  if (!validated.success) return { success: false, error: validated.error };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Session expirée.' };

  // Correction : Cast 'any' pour éviter l'erreur de propriété 'cabinet_id' sur type 'never'
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
    act_type: data.act_type,
    act_number: data.act_number || null,
    title: data.title,
    description: data.description || null,
    act_date: data.act_date || null,
    notary_fees: data.notary_fees ?? null,
    tax_amount: data.tax_amount ?? null,
    signed: data.signed ?? false,
    signed_at: data.signed ? new Date().toISOString() : null,
    ...(data.id ? {} : { created_by: user.id }),
  };

  if (data.id) {
    // Correction : Cast 'as any' pour l'accès à la table 'notary_acts'
    const { error } = await (supabase.from('notary_acts') as any).update(payload).eq('id', data.id);
    if (error) return { success: false, error: error.message };
  } else {
    // Correction : Cast 'as any' pour l'insertion
    const { error } = await (supabase.from('notary_acts') as any).insert(payload);
    if (error) return { success: false, error: error.message };
  }
  
  revalidatePath('/dashboard/actes');
  return { success: true };
}

export async function deleteNotaryAct(id: string) {
  const supabase = createClient();
  // Correction : Cast 'as any' pour la suppression
  await (supabase.from('notary_acts') as any).delete().eq('id', id);
  revalidatePath('/dashboard/actes');
  redirect('/dashboard/actes');
}
