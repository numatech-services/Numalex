'use server';

import { paymentSchema, validateInput } from '@/lib/validations';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addPayment(data: {
  facture_id: string;
  montant: number;
  mode: string;
  reference?: string;
  notes?: string;
}) {
  const validated = validateInput(paymentSchema, data);
  if (!validated.success) return { success: false, error: validated.error };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Session expirée.' };

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single();
  if (!profile) return { success: false, error: 'Profil introuvable.' };

  // Vérifier que la facture appartient au cabinet
  const { data: facture } = await supabase
    .from('invoices')
    .select('id, total_ttc, status')
    .eq('id', data.facture_id)
    .single();

  if (!facture) return { success: false, error: 'Facture introuvable.' };
  if (facture.status === 'payee') return { success: false, error: 'Facture déjà payée.' };
  if (facture.status === 'annulee') return { success: false, error: 'Facture annulée.' };

  // Insérer le paiement
  const { error } = await supabase.from('paiements').insert({
    cabinet_id: profile.cabinet_id,
    facture_id: data.facture_id,
    montant: data.montant,
    mode: data.mode,
    reference: data.reference || null,
    notes: data.notes || null,
    statut: 'reussi',
  });

  if (error) return { success: false, error: error.message };

  // Calculer le total payé et mettre à jour le statut de la facture
  const { data: payments } = await supabase
    .from('paiements')
    .select('montant')
    .eq('facture_id', data.facture_id)
    .eq('statut', 'reussi');

  const totalPaid = (payments ?? []).reduce((s, p) => s + Number(p.montant), 0);

  let newStatus = facture.status;
  if (totalPaid >= (facture.total_ttc ?? 0)) {
    newStatus = 'payee';
  } else if (totalPaid > 0) {
    // Statut partiel — on garde "envoyee" car notre enum n'a pas "partielle"
    newStatus = 'envoyee';
  }

  if (newStatus !== facture.status) {
    await supabase.from('invoices').update({
      status: newStatus,
      ...(newStatus === 'payee' ? { paid_at: new Date().toISOString().split('T')[0] } : {}),
    }).eq('id', data.facture_id);
  }

  revalidatePath('/dashboard/factures');
  return { success: true };
}

export async function fetchPayments(factureId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('paiements')
    .select('id, montant, mode, reference, statut, paid_at, notes')
    .eq('facture_id', factureId)
    .order('paid_at', { ascending: false });
  return data ?? [];
}
