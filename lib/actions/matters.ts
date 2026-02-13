'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { matterSchema, type MatterFormValues } from '@/lib/validators/matter';

// ---- Types de retour ----

interface ActionSuccess {
  success: true;
  matterId: string;
}

interface ActionError {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
}

export type UpsertMatterResult = ActionSuccess | ActionError;

// ============================================================
// Action principale : upsertMatter
// ============================================================

export async function upsertMatter(
  formData: MatterFormValues
): Promise<UpsertMatterResult> {
  const supabase = createClient();

  // ── 1. Authentification ──
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
  }

  // ── 2. Récupérer le cabinet_id depuis le profil (sécurité) ──
  // Correction : On force le type 'any' pour éviter l'erreur 'never' au build
  const { data: profile, error: profileError }: { data: any; error: any } = await supabase
    .from('profiles')
    .select('cabinet_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Profil introuvable. Contactez l\'administrateur.' };
  }

  // ── 3. Validation Zod ──
  const parsed = matterSchema.safeParse(formData);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return {
      success: false,
      error: 'Données invalides. Vérifiez les champs du formulaire.',
      fieldErrors,
    };
  }

  const { id, client_id, ...fields } = parsed.data;

  // ── 4. Préparer le payload ──
  const payload = {
    title: fields.title,
    status: fields.status,
    description: fields.description || null,
    juridiction: fields.juridiction || null,
    parties_adverses: fields.parties_adverses || null,
    date_signification: fields.date_signification || null,
    client_id: client_id || null,
    cabinet_id: profile.cabinet_id,
    ...(id ? {} : { created_by: user.id }),
  };

  // ── 5. INSERT ou UPDATE ──
  if (id) {
    // Vérification que le dossier appartient au cabinet
    const { data: existing, error: fetchError } = await supabase
      .from('matters')
      .select('id')
      .eq('id', id)
      .eq('cabinet_id', profile.cabinet_id)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Dossier introuvable ou accès non autorisé.',
      };
    }

    // Correction : Cast 'as any' pour l'update
    const { error: updateError } = await (supabase.from('matters') as any)
      .update(payload)
      .eq('id', id);

    if (updateError) {
      console.error('[upsertMatter] UPDATE error:', updateError);
      return {
        success: false,
        error: `Échec de la mise à jour : ${updateError.message}`,
      };
    }

    revalidatePath('/dashboard/dossiers');
    revalidatePath(`/dashboard/dossiers/${id}`);

    return { success: true, matterId: id };
  } else {
    // Correction : Cast 'as any' pour l'insert
    const { data: newMatter, error: insertError } = await (supabase.from('matters') as any)
      .insert(payload)
      .select('id')
      .single();

    if (insertError || !newMatter) {
      console.error('[upsertMatter] INSERT error:', insertError);
      return {
        success: false,
        error: `Échec de la création : ${insertError?.message ?? 'erreur inconnue'}`,
      };
    }

    revalidatePath('/dashboard/dossiers');

    return { success: true, matterId: newMatter.id };
  }
}

// ============================================================
// Action secondaire : deleteMatter
// ============================================================

export async function deleteMatter(matterId: string): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Non authentifié.');
  }

  // Correction : Cast 'any' ici aussi
  const { data: profile }: { data: any } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    throw new Error('Profil introuvable.');
  }

  const { error } = await supabase
    .from('matters')
    .delete()
    .eq('id', matterId)
    .eq('cabinet_id', profile.cabinet_id);

  if (error) {
    throw new Error(`Suppression échouée : ${error.message}`);
  }

  revalidatePath('/dashboard/dossiers');
  redirect('/dashboard/dossiers');
}
