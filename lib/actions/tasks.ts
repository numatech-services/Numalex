'use server';

import { z } from 'zod';
const taskSchema = z.object({ title: z.string().min(2).max(300), matter_id: z.string().uuid().optional().or(z.literal('')), due_date: z.string().optional(), priority: z.enum(['urgente','haute','normal','basse']).default('normal') });

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single();
  if (!profile) return { success: false, error: 'Profil introuvable.' };

  const { error } = await supabase.from('tasks').insert({
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
  const { error } = await supabase.from('tasks').update({
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }).eq('id', taskId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}

export async function markAlertRead(alertId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('alerts').update({
    read: true,
    read_at: new Date().toISOString(),
  }).eq('id', alertId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}
