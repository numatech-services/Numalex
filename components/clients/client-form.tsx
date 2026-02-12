// ============================================================
// NumaLex — Formulaire Client (Client Component)
// ============================================================

'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, CLIENT_TYPES, type ClientFormValues } from '@/lib/validators/client';
import { upsertClient } from '@/lib/actions/clients';
import { useToast } from '@/components/ui/toast';

interface ClientFormProps {
  initialData?: ClientFormValues & { id: string };
}

const TYPE_LABELS: Record<string, string> = {
  physique: 'Personne physique',
  morale: 'Personne morale',
};

export function ClientForm({ initialData }: ClientFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const formId = useId();

  const isEditing = Boolean(initialData?.id);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      id: initialData?.id ?? undefined,
      full_name: initialData?.full_name ?? '',
      client_type: initialData?.client_type ?? 'physique',
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
      address: initialData?.address ?? '',
      notes: initialData?.notes ?? '',
    },
  });

  const { register, handleSubmit, formState: { errors } } = form;
  const busy = isPending;

  function onSubmit(values: ClientFormValues) {
    startTransition(async () => {
      const result = await upsertClient(values);
      if (result.success) {
        toast('success', isEditing ? 'Client modifié.' : 'Client créé.');
        router.push('/dashboard/clients');
        router.refresh();
      } else {
        toast('error', result.error);
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([key, msgs]) => {
            form.setError(key as keyof typeof form.getValues(), { message: msgs[0] });
          });
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {initialData?.id && <input type="hidden" {...register('id')} />}

      {/* Nom */}
      <div className="space-y-1.5">
        <label htmlFor={`${formId}-name`} className="block text-sm font-medium text-slate-700">
          Nom complet / Raison sociale <span className="text-red-500" aria-hidden>*</span>
        </label>
        <input
          id={`${formId}-name`}
          type="text"
          placeholder="Ex : Abdoulaye Diallo / Société ABC SARL"
          {...register('full_name')}
          disabled={busy}
          className={inputCls(errors.full_name)}
        />
        {errors.full_name && <p className="text-xs text-red-600" role="alert">{errors.full_name.message}</p>}
      </div>

      {/* Type + Téléphone */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${formId}-type`} className="block text-sm font-medium text-slate-700">
            Type <span className="text-red-500" aria-hidden>*</span>
          </label>
          <select id={`${formId}-type`} {...register('client_type')} disabled={busy} className={inputCls(errors.client_type)}>
            {CLIENT_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          {errors.client_type && <p className="text-xs text-red-600" role="alert">{errors.client_type.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${formId}-phone`} className="block text-sm font-medium text-slate-700">Téléphone</label>
          <input id={`${formId}-phone`} type="tel" placeholder="+227 90 12 34 56" {...register('phone')} disabled={busy} className={inputCls(errors.phone)} />
          {errors.phone && <p className="text-xs text-red-600" role="alert">{errors.phone.message}</p>}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor={`${formId}-email`} className="block text-sm font-medium text-slate-700">Email</label>
        <input id={`${formId}-email`} type="email" placeholder="contact@exemple.ne" {...register('email')} disabled={busy} className={inputCls(errors.email)} />
        {errors.email && <p className="text-xs text-red-600" role="alert">{errors.email.message}</p>}
      </div>

      {/* Adresse */}
      <div className="space-y-1.5">
        <label htmlFor={`${formId}-addr`} className="block text-sm font-medium text-slate-700">Adresse</label>
        <input id={`${formId}-addr`} type="text" placeholder="Quartier, ville" {...register('address')} disabled={busy} className={inputCls(errors.address)} />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label htmlFor={`${formId}-notes`} className="block text-sm font-medium text-slate-700">Notes</label>
        <textarea id={`${formId}-notes`} rows={3} placeholder="Informations complémentaires…" {...register('notes')} disabled={busy} className={inputCls(errors.notes)} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
        <button type="button" onClick={() => router.back()} disabled={busy}
          className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">
          Annuler
        </button>
        <button type="submit" disabled={busy}
          className="relative h-10 rounded-lg bg-slate-900 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-60">
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </span>
          )}
          <span className={busy ? 'invisible' : ''}>
            {isEditing ? 'Enregistrer' : 'Créer le client'}
          </span>
        </button>
      </div>
    </form>
  );
}

function inputCls(error?: { message?: string }): string {
  const base = 'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';
  return error
    ? `${base} border-red-300 focus:border-red-400 focus:ring-red-500/20`
    : `${base} border-slate-200 focus:border-slate-300 focus:ring-slate-900/10`;
}
