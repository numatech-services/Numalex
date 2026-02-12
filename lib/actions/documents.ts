'use server';

import { handleSupabaseError } from '@/lib/utils/api-response';
import { z } from 'zod';
const uploadSchema = z.object({ title: z.string().min(1).max(300), doc_type: z.string(), matter_id: z.string().optional() });
// re-export from '@/lib/utils/api-response';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type UploadResult = { success: true; documentId: string } | { success: false; error: string };
export async function uploadDocument(formData: FormData): Promise<UploadResult> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Session expirée.' };

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single();
  if (!profile) return { success: false, error: 'Profil introuvable.' };

  const file = formData.get('file') as File | null;
  const title = (formData.get('title') as string)?.trim();
  const docType = (formData.get('doc_type') as string) || 'autre';
  const matterId = (formData.get('matter_id') as string) || null;

  if (!file || file.size === 0) return { success: false, error: 'Aucun fichier sélectionné.' };
  if (!title) return { success: false, error: 'Le titre est obligatoire.' };
  if (file.size > 10 * 1024 * 1024) return { success: false, error: 'Fichier trop volumineux (max 10 Mo).' };

  // Validation MIME stricte — seuls les types autorisés
  const ALLOWED_MIMES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg', 'image/png', 'image/webp',
    'text/plain',
  ];
  if (!ALLOWED_MIMES.includes(file.type)) {
    return { success: false, error: `Type de fichier non autorisé (${file.type}). Formats acceptés : PDF, Word, Excel, images (JPG/PNG), texte.` };
  }

  // Validation extension
  const ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'xlsx', 'jpg', 'jpeg', 'png', 'webp', 'txt'];
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  if (!ALLOWED_EXTS.includes(ext)) {
    return { success: false, error: `Extension .${ext} non autorisée.` };
  }

  // Stockage organisé : /org/{cabinetId}/matters/{matterId}/filename
  const matterPath = matterId ? `matters/${matterId}` : 'general';
  const storagePath = `${profile.cabinet_id}/${matterPath}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error('[uploadDocument] Storage error:', uploadError);
    return { success: false, error: 'Échec de l\'upload : ' + uploadError.message };
  }

  // Récupérer l'URL publique (ou signée selon la config)
  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);
  const fileUrl = urlData.publicUrl;

  // Créer l'enregistrement en base
  const { data: doc, error: dbError } = await supabase
    .from('documents')
    .insert({
      cabinet_id: profile.cabinet_id,
      title,
      doc_type: docType,
      file_url: fileUrl,
      file_size: file.size,
      mime_type: file.type,
      matter_id: matterId,
      uploaded_by: user.id,
    })
    .select('id')
    .single();

  if (dbError || !doc) {
    return { success: false, error: dbError?.message ?? 'Erreur base de données' };
  }

  revalidatePath('/dashboard/documents');
  return { success: true, documentId: doc.id };
}

export async function deleteDocument(documentId: string): Promise<void> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié.');

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single();
  if (!profile) throw new Error('Profil introuvable.');

  // Récupérer le path pour supprimer du storage
  const { data: doc } = await supabase.from('documents').select('file_url').eq('id', documentId).eq('cabinet_id', profile.cabinet_id).single();

  const { error } = await supabase.from('documents').delete().eq('id', documentId).eq('cabinet_id', profile.cabinet_id);
  if (error) throw new Error(error.message);

  // Tenter de supprimer du storage (best-effort)
  if (doc?.file_url) {
    const path = doc.file_url.split('/documents/')[1];
    if (path) {
      await supabase.storage.from('documents').remove([decodeURIComponent(path)]);
    }
  }

  revalidatePath('/dashboard/documents');
  redirect('/dashboard/documents');
}
