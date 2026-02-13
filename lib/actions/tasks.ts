'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const taskSchema = z.object({ 
  title: z.string().min(2).max(300), 
  matter_id: z.string().uuid().optional().or(z.literal('')), 
  due_date: z.string().optional(), 
  priority: z.enum(['urgente','haute','normal','basse']).default('normal') 
});

export async function createTask(formData: {
  title: string;
  matter_id?: string;
  due_date?: string;
  priority?: string;
}) {
  const parsed = taskSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Données invalides" };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Non authentifié.' };

  // Correction : Cast 'any' pour éviter l'erreur 'never'
  const { data: profile }: { data: any } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Profil introuvable.' };

  // Correction CRUCIALE : cast 'as any' pour autoriser l'insertion
  const { error } = await (supabase.from('tasks') as any).insert({
    cabinet_id: profile.cabinet_id,
    title: formData.title,
    matter_id: formData.matter_id || null,
    due_date: formData.due_date || null,
    priority: formData.priority || 'normal',
    created_by: user.id,
    assigned_to: user.id,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}

export async function toggleTask(taskId: string, completed: boolean) {
  const supabase = createClient();
  // Correction : cast 'as any' pour l'update
  const { error } = await (supabase.from('tasks') as any).update({
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }).eq('id', taskId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = createClient();
  // Correction : cast 'as any' pour la suppression
  const { error } = await (supabase.from('tasks') as any).delete().eq('id', taskId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}

export async function markAlertRead(alertId: string) {
  const supabase = createClient();
  // Correction : cast 'as any' pour la table alerts
  const { error } = await (supabase.from('alerts') as any).update({
    read: true,
    read_at: new Date().toISOString(),
  }).eq('id', alertId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}
