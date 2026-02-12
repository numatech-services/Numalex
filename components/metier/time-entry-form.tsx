'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useId } from 'react';
import { upsertTimeEntry } from '@/lib/actions/time-entries';
import { useToast } from '@/components/ui/toast';

interface Props {
  matters: { id: string; title: string }[];
  // Correction : On utilise 'any' ici pour simplifier l'accès aux propriétés de données initiales
  initialData?: Record<string, any>;
}

export function TimeEntryForm({ matters, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fid = useId();
  const cls = 'block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await upsertTimeEntry({
        // Correction : Cast explicite en string ou undefined
        id: initialData?.id as string | undefined,
        matter_id: fd.get('matter_id') as string,
        minutes: Number(fd.get('minutes')),
        description: fd.get('description') as string,
        entry_date: fd.get('entry_date') as string,
        hourly_rate: fd.get('hourly_rate') ? Number(fd.get('hourly_rate')) : undefined,
        billable: fd.get('billable') === 'on',
      });
      
      if (r.success) { 
        toast('success', 'Entrée enregistrée.'); 
        router.push('/dashboard/temps'); 
        router.refresh(); 
      } else {
        toast('error', r.error ?? 'Erreur');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-m`} className="block text-sm font-medium text-slate-700">Dossier <span className="text-red-500">*</span></label>
          <select id={`${fid}-m`} name="matter_id" required disabled={isPending} className={cls} defaultValue={initialData?.matter_id ?? ''}>
            <option value="">— Sélectionner —</option>
            {matters.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-d`} className="block text-sm font-medium text-slate-700">Date</label>
          <input id={`${fid}-d`} name="entry_date" type="date" defaultValue={initialData?.entry_date ?? new Date().toISOString().split('T')[0]} disabled={isPending} className={cls} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-min`} className="block text-sm font-medium text-slate-700">Durée (min) <span className="text-red-500">*</span></label>
          <input id={`${fid}-min`} name="minutes" type="number" min="1" max="1440" required defaultValue={initialData?.minutes ?? 30} disabled={isPending} className={cls} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-rate`} className="block text-sm font-medium text-slate-700">Taux horaire (FCFA)</label>
          <input id={`${fid}-rate`} name="hourly_rate" type="number" min="0" step="1" defaultValue={initialData?.hourly_rate ?? ''} disabled={isPending} className={cls} placeholder="Ex : 50 000" />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input name="billable" type="checkbox" defaultChecked={initialData?.billable ?? true} className="rounded border-slate-300" />
            Facturable
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${fid}-desc`} className="block text-sm font-medium text-slate-700">Description <span className="text-red-500">*</span></label>
        <textarea id={`${fid}-desc`} name="description" rows={3} required defaultValue={initialData?.description ?? ''} disabled={isPending} className={cls} placeholder="Rédaction conclusions, recherche jurisprudence…" />
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button type="button" onClick={() => router.back()} className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button>
        <button type="submit" disabled={isPending} className="h-10 rounded-lg bg-slate-900 px-6 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60">
          {isPending ? 'Enregistrement…' : initialData?.id ? 'Modifier' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
