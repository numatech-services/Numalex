'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema, INVOICE_STATUSES, INVOICE_STATUS_LABELS, type InvoiceFormValues } from '@/lib/validators/invoice';
import { upsertInvoice } from '@/lib/actions/invoices';
import { useToast } from '@/components/ui/toast';

interface InvoiceFormProps {
  initialData?: InvoiceFormValues & { id: string };
  clients: { id: string; full_name: string }[];
  matters: { id: string; title: string }[];
}

export function InvoiceForm({ initialData, clients, matters }: InvoiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fid = useId();
  const isEditing = Boolean(initialData?.id);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      id: initialData?.id,
      invoice_number: initialData?.invoice_number ?? '',
      client_id: initialData?.client_id ?? '',
      matter_id: initialData?.matter_id ?? '',
      amount_ht: initialData?.amount_ht ?? 0,
      tva_rate: initialData?.tva_rate ?? 19,
      status: initialData?.status ?? 'brouillon',
      issued_at: initialData?.issued_at ?? '',
      due_at: initialData?.due_at ?? '',
      paid_at: initialData?.paid_at ?? '',
      notes: initialData?.notes ?? '',
    },
  });

  const { register, handleSubmit, control, formState: { errors } } = form;
  const busy = isPending;

  // Live calculation
  const amountHt = useWatch({ control, name: 'amount_ht' }) || 0;
  const tvaRate = useWatch({ control, name: 'tva_rate' }) || 19;
  const tvaAmount = amountHt * tvaRate / 100;
  const totalTtc = amountHt + tvaAmount;

  const fmtCFA = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' FCFA';

  function onSubmit(values: InvoiceFormValues) {
    startTransition(async () => {
      const result = await upsertInvoice(values);
      if (result.success) {
        toast('success', isEditing ? 'Facture modifiée.' : 'Facture créée.');
        router.push('/dashboard/factures');
        router.refresh();
      } else {
        toast('error', result.error);
      }
    });
  }

  const cls = (err?: { message?: string }) => {
    const base = 'block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50';
    return err ? `${base} border-red-300 focus:ring-red-500/20 text-slate-900` : `${base} border-slate-200 focus:ring-slate-900/10 text-slate-900`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {initialData?.id && <input type="hidden" {...register('id')} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-num`} className="block text-sm font-medium text-slate-700">N° Facture <span className="text-red-500">*</span></label>
          <input id={`${fid}-num`} type="text" placeholder="FAC-2026-001" {...register('invoice_number')} disabled={busy} className={cls(errors.invoice_number)} />
          {errors.invoice_number && <p className="text-xs text-red-600">{errors.invoice_number.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-st`} className="block text-sm font-medium text-slate-700">Statut</label>
          <select id={`${fid}-st`} {...register('status')} disabled={busy} className={cls()}>
            {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-cl`} className="block text-sm font-medium text-slate-700">Client</label>
          <select id={`${fid}-cl`} {...register('client_id')} disabled={busy} className={cls()}>
            <option value="">— Aucun —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-ma`} className="block text-sm font-medium text-slate-700">Dossier lié</label>
          <select id={`${fid}-ma`} {...register('matter_id')} disabled={busy} className={cls()}>
            <option value="">— Aucun —</option>
            {matters.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      </div>

      {/* Montants */}
      <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-400">Montants</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor={`${fid}-ht`} className="block text-sm font-medium text-slate-700">Montant HT (FCFA) <span className="text-red-500">*</span></label>
            <input id={`${fid}-ht`} type="number" step="1" min="0" {...register('amount_ht', { valueAsNumber: true })} disabled={busy} className={cls(errors.amount_ht)} />
            {errors.amount_ht && <p className="text-xs text-red-600">{errors.amount_ht.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${fid}-tv`} className="block text-sm font-medium text-slate-700">Taux TVA (%)</label>
            <input id={`${fid}-tv`} type="number" step="0.01" min="0" max="100" {...register('tva_rate', { valueAsNumber: true })} disabled={busy} className={cls()} />
          </div>
        </div>
        {/* Calcul live */}
        <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm border border-slate-200">
          <div className="space-y-0.5">
            <p className="text-slate-500">TVA ({tvaRate}%) : <span className="font-medium text-slate-700">{fmtCFA(tvaAmount)}</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total TTC</p>
            <p className="text-xl font-bold text-slate-900">{fmtCFA(totalTtc)}</p>
          </div>
        </div>
      </fieldset>

      {/* Dates */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-di`} className="block text-sm font-medium text-slate-700">Date émission</label>
          <input id={`${fid}-di`} type="date" {...register('issued_at')} disabled={busy} className={cls()} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-dd`} className="block text-sm font-medium text-slate-700">Échéance</label>
          <input id={`${fid}-dd`} type="date" {...register('due_at')} disabled={busy} className={cls()} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-dp`} className="block text-sm font-medium text-slate-700">Date paiement</label>
          <input id={`${fid}-dp`} type="date" {...register('paid_at')} disabled={busy} className={cls()} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${fid}-n`} className="block text-sm font-medium text-slate-700">Notes</label>
        <textarea id={`${fid}-n`} rows={2} {...register('notes')} disabled={busy} className={cls()} />
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
        <button type="button" onClick={() => router.back()} disabled={busy} className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
        <button type="submit" disabled={busy} className="relative h-10 rounded-lg bg-slate-900 px-6 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60">
          {busy && <span className="absolute inset-0 flex items-center justify-center"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /></span>}
          <span className={busy ? 'invisible' : ''}>{isEditing ? 'Enregistrer' : 'Créer la facture'}</span>
        </button>
      </div>
    </form>
  );
}
