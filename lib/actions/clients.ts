'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { clientSchema, type ClientFormValues } from '@/lib/validators/client';

interface ActionSuccess {
  success: true;
  clientId: string;
}

interface ActionError {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
}

export type ClientActionResult = ActionSuccess | ActionError;

// ============================================================
// Upsert Client
// ============================================================

export async function upsertClient(
  formData: ClientFormValues
): Promise<ClientActionResult> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
  }

  // Correction : On force le type 'any' pour éviter que TypeScript ne bloque sur 'never'
  const { data: profile }: { data: any } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { success: false, error: 'Profil introuvable.' };
  }

  const parsed = clientSchema.safeParse(formData);
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
    full_name: fields.full_name,
    client_type: fields.client_type,
    phone: fields.phone || null,
    email: fields.email || null,
    address: fields.address || null,
    notes: fields.notes || null,
    cabinet_id: profile.cabinet_id,
    ...(id ? {} : { created_by: user.id }),
  };

  if (id) {
    // Vérification de sécurité pour s'assurer que le client appartient au cabinet
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('cabinet_id', profile.cabinet_id)
      .single();

    if (!existing) {
      return { success: false, error: 'Client introuvable ou accès non autorisé.' };
    }

    // Correction : On force le cast as 'any' pour l'update si nécessaire
    const { error: updateError } = await (supabase.from('clients') as any)
      .update(payload)
      .eq('id', id);

    if (updateError) {
      return { success: false, error: `Échec : ${updateError.message}` };
    }

    revalidatePath('/dashboard/clients');
    return { success: true, clientId: id };
  } else {
    // Correction : Cast 'as any' pour l'insert
    const { data: newClient, error: insertError } = await (supabase.from('clients') as any)
      .insert(payload)
      .select('id')
      .single();

    if (insertError || !newClient) {
      return { success: false, error: `Échec : ${insertError?.message ?? 'erreur'}` };
    }

    revalidatePath('/dashboard/clients');
    return { success: true, clientId: newClient.id };
  }
}

// ============================================================
// Delete Client
// ============================================================

export async function deleteClient(clientId: string): Promise<void> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié.');

  const { data: profile }: { data: any } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profil introuvable.');

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('cabinet_id', profile.cabinet_id);

  if (error) throw new Error(`Suppression échouée : ${error.message}`);

  revalidatePath('/dashboard/clients');
  redirect('/dashboard/clients');
}
