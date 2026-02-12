'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, EVENT_TYPES, EVENT_TYPE_LABELS, type EventFormValues } from '@/lib/validators/event';
import { upsertEvent } from '@/lib/actions/events';
import { useToast } from '@/components/ui/toast';

interface EventFormProps {
  initialData?: EventFormValues & { id: string };
  matters: { id: string; title: string }[];
}

export function EventForm({ initialData, matters }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fid = useId();
  const isEditing = Boolean(initialData?.id);

  const { register, handleSubmit, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      id: initialData?.id,
      title: initialData?.title ?? '',
      event_type: initialData?.event_type ?? 'rdv',
      matter_id: initialData?.matter_id ?? '',
      starts_at: initialData?.starts_at ? initialData.starts_at.slice(0, 16) : '',
      ends_at: initialData?.ends_at ? initialData.ends_at.slice(0, 16) : '',
      location: initialData?.location ?? '',
      description: initialData?.description ?? '',
    },
  });

  const busy = isPending;

  function onSubmit(values: EventFormValues) {
    startTransition(async () => {
      const result = await upsertEvent(values);
      if (result.success) {
        toast('success', isEditing ? 'Événement modifié.' : 'Événement créé.');
        router.push('/dashboard/agenda');
        router.refresh();
      } else {
        toast('error', result.error);
      }
    });
  }

  const inputCls = (err?: { message?: string }) => {
    const base = 'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50';
    return err ? `${base} border-red-300 focus:ring-red-500/20` : `${base} border-slate-200 focus:ring-slate-900/10`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {initialData?.id && <input type="hidden" {...register('id')} />}

      <div className="space-y-1.5">
        <label htmlFor={`${fid}-t`} className="block text-sm font-medium text-slate-700">Titre <span className="text-red-500">*</span></label>
        <input id={`${fid}-t`} type="text" placeholder="Ex : Audience SARL ABC" {...register('title')} disabled={busy} className={inputCls(errors.title)} />
        {errors.title && <p className="text-xs text-red-600" role="alert">{errors.title.message}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-et`} className="block text-sm font-medium text-slate-700">Type <span className="text-red-500">*</span></label>
          <select id={`${fid}-et`} {...register('event_type')} disabled={busy} className={inputCls(errors.event_type)}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-m`} className="block text-sm font-medium text-slate-700">Dossier lié</label>
          <select id={`${fid}-m`} {...register('matter_id')} disabled={busy} className={inputCls()}>
            <option value="">— Aucun —</option>
            {matters.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-s`} className="block text-sm font-medium text-slate-700">Début <span className="text-red-500">*</span></label>
          <input id={`${fid}-s`} type="datetime-local" {...register('starts_at')} disabled={busy} className={inputCls(errors.starts_at)} />
          {errors.starts_at && <p className="text-xs text-red-600" role="alert">{errors.starts_at.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-e`} className="block text-sm font-medium text-slate-700">Fin</label>
          <input id={`${fid}-e`} type="datetime-local" {...register('ends_at')} disabled={busy} className={inputCls()} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${fid}-l`} className="block text-sm font-medium text-slate-700">Lieu</label>
        <input id={`${fid}-l`} type="text" placeholder="Ex : TGI Niamey, Salle 3" {...register('location')} disabled={busy} className={inputCls()} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${fid}-d`} className="block text-sm font-medium text-slate-700">Notes</label>
        <textarea id={`${fid}-d`} rows={3} placeholder="Détails supplémentaires…" {...register('description')} disabled={busy} className={inputCls()} />
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
        <button type="button" onClick={() => router.back()} disabled={busy} className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
        <button type="submit" disabled={busy} className="relative h-10 rounded-lg bg-slate-900 px-6 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60">
          {busy && <span className="absolute inset-0 flex items-center justify-center"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /></span>}
          <span className={busy ? 'invisible' : ''}>{isEditing ? 'Enregistrer' : 'Créer'}</span>
        </button>
      </div>
    </form>
  );
}
