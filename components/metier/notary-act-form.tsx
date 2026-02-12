'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useId } from 'react';
import { upsertNotaryAct } from '@/lib/actions/notary-acts';
import { useToast } from '@/components/ui/toast';

const ACT_TYPES = [
  { value: 'vente_immobiliere', label: 'Vente immobilière' },
  { value: 'donation', label: 'Donation' },
  { value: 'testament', label: 'Testament' },
  { value: 'constitution_societe', label: 'Constitution de société' },
  { value: 'bail', label: 'Bail' },
  { value: 'procuration', label: 'Procuration' },
  { value: 'certificat_heritage', label: "Certificat d'hérédité" },
  { value: 'acte_notoriete', label: 'Acte de notoriété' },
  { value: 'autre', label: 'Autre' },
];

interface Props { matters: { id: string; title: string }[]; clients: { id: string; full_name: string }[]; initialData?: Record<string, unknown>; }

export function NotaryActForm({ matters, clients, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fid = useId();
  const cls = 'block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await upsertNotaryAct({
        id: initialData?.id,
        title: fd.get('title') as string,
        act_type: fd.get('act_type') as string,
        act_number: fd.get('act_number') as string,
        matter_id: fd.get('matter_id') as string || undefined,
        client_id: fd.get('client_id') as string || undefined,
        description: fd.get('description') as string,
        act_date: fd.get('act_date') as string,
        notary_fees: fd.get('notary_fees') ? Number(fd.get('notary_fees')) : undefined,
        tax_amount: fd.get('tax_amount') ? Number(fd.get('tax_amount')) : undefined,
        signed: fd.get('signed') === 'on',
      });
      if (r.success) { toast('success', 'Acte enregistré.'); router.push('/dashboard/actes'); router.refresh(); }
      else toast('error', r.error ?? 'Erreur');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor={`${fid}-t`} className="block text-sm font-medium text-slate-700">Intitulé de l'acte <span className="text-red-500">*</span></label>
        <input id={`${fid}-t`} name="title" type="text" required defaultValue={initialData?.title ?? ''} disabled={isPending} className={cls} placeholder="Ex : Vente terrain Niamey Koira Kano" />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-at`} className="block text-sm font-medium text-slate-700">Type <span className="text-red-500">*</span></label>
          <select id={`${fid}-at`} name="act_type" required disabled={isPending} className={cls} defaultValue={initialData?.act_type ?? 'autre'}>
            {ACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-num`} className="block text-sm font-medium text-slate-700">N° Répertoire</label>
          <input id={`${fid}-num`} name="act_number" type="text" defaultValue={initialData?.act_number ?? ''} disabled={isPending} className={cls} placeholder="REP-2026-042" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-ad`} className="block text-sm font-medium text-slate-700">Date de l'acte</label>
          <input id={`${fid}-ad`} name="act_date" type="date" defaultValue={initialData?.act_date ?? ''} disabled={isPending} className={cls} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-cl`} className="block text-sm font-medium text-slate-700">Client</label>
          <select id={`${fid}-cl`} name="client_id" disabled={isPending} className={cls} defaultValue={initialData?.client_id ?? ''}>
            <option value="">— Aucun —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-ma`} className="block text-sm font-medium text-slate-700">Dossier lié</label>
          <select id={`${fid}-ma`} name="matter_id" disabled={isPending} className={cls} defaultValue={initialData?.matter_id ?? ''}>
            <option value="">— Aucun —</option>
            {matters.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-fees`} className="block text-sm font-medium text-slate-700">Frais de notaire (FCFA)</label>
          <input id={`${fid}-fees`} name="notary_fees" type="number" min="0" defaultValue={initialData?.notary_fees ?? ''} disabled={isPending} className={cls} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-tax`} className="block text-sm font-medium text-slate-700">Droits d'enregistrement (FCFA)</label>
          <input id={`${fid}-tax`} name="tax_amount" type="number" min="0" defaultValue={initialData?.tax_amount ?? ''} disabled={isPending} className={cls} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${fid}-desc`} className="block text-sm font-medium text-slate-700">Description</label>
        <textarea id={`${fid}-desc`} name="description" rows={3} defaultValue={initialData?.description ?? ''} disabled={isPending} className={cls} />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input name="signed" type="checkbox" defaultChecked={initialData?.signed ?? false} className="rounded border-slate-300" />
        Acte signé
      </label>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button type="button" onClick={() => router.back()} className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button>
        <button type="submit" disabled={isPending} className="h-10 rounded-lg bg-slate-900 px-6 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60">
          {isPending ? 'Enregistrement…' : initialData?.id ? 'Modifier' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
