'use server';

import { handleSupabaseError } from '@/lib/utils/api-response';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { invoiceSchema, type InvoiceFormValues } from '@/lib/validators/invoice';

interface ActionSuccess { success: true; invoiceId: string; }
interface ActionError { success: false; error: string; fieldErrors?: Record<string, string[]>; }
export type InvoiceActionResult = ActionSuccess | ActionError;

export async function upsertInvoice(formData: InvoiceFormValues): Promise<InvoiceActionResult> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Session expirée.' };

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single();
  if (!profile) return { success: false, error: 'Profil introuvable.' };

  const parsed = invoiceSchema.safeParse(formData);
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
  // tva_amount et total_ttc sont GENERATED columns — ne pas les envoyer
  const payload = {
    invoice_number: fields.invoice_number,
    amount_ht: fields.amount_ht,
    tva_rate: fields.tva_rate,
    status: fields.status,
    client_id: fields.client_id || null,
    matter_id: fields.matter_id || null,
    issued_at: fields.issued_at || null,
    due_at: fields.due_at || null,
    paid_at: fields.paid_at || null,
    notes: fields.notes || null,
    cabinet_id: profile.cabinet_id,
    ...(id ? {} : { created_by: user.id }),
  };

  if (id) {
    const { data: existing } = await supabase.from('invoices').select('id').eq('id', id).eq('cabinet_id', profile.cabinet_id).single();
    if (!existing) return { success: false, error: 'Facture introuvable.' };

    const { error } = await supabase.from('invoices').update(payload).eq('id', id);
    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/factures');
    return { success: true, invoiceId: id };
  } else {
    const { data: newInv, error } = await supabase.from('invoices').insert(payload).select('id').single();
    if (error || !newInv) return { success: false, error: error?.message ?? 'Erreur' };

    revalidatePath('/dashboard/factures');
    return { success: true, invoiceId: newInv.id };
  }
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié.');

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single();
  if (!profile) throw new Error('Profil introuvable.');

  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId).eq('cabinet_id', profile.cabinet_id);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/factures');
  redirect('/dashboard/factures');
}
