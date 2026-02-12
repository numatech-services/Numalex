'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useId } from 'react';
import { upsertBailiffReport } from '@/lib/actions/bailiff-reports';
import { useToast } from '@/components/ui/toast';

const REPORT_TYPES = [
  { value: 'constat', label: 'Constat' }, { value: 'signification', label: 'Signification' },
  { value: 'saisie', label: 'Saisie' }, { value: 'expulsion', label: 'Expulsion' },
  { value: 'inventaire', label: 'Inventaire' }, { value: 'sommation', label: 'Sommation' },
  { value: 'autre', label: 'Autre' },
];

interface Props { 
  matters: { id: string; title: string }[]; 
  clients: { id: string; full_name: string }[]; 
  initialData?: Record<string, any>; // Correction : Utilisation de 'any' pour assouplir le typage des données initiales
}

export function BailiffReportForm({ matters, clients, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fid = useId();
  const cls = 'block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await upsertBailiffReport({
        id: initialData?.id as string | undefined, // Correction : Cast explicite pour TypeScript
        title: fd.get('title') as string,
        report_type: fd.get('report_type') as string,
        report_number: fd.get('report_number') as string,
        matter_id: fd.get('matter_id') as string || undefined,
        client_id: fd.get('client_id') as string || undefined,
        location: fd.get('location') as string,
        gps_lat: fd.get('gps_lat') ? Number(fd.get('gps_lat')) : undefined,
        gps_lng: fd.get('gps_lng') ? Number(fd.get('gps_lng')) : undefined,
        description: fd.get('description') as string,
        report_date: fd.get('report_date') as string,
        served: fd.get('served') === 'on',
        served_to: fd.get('served_to') as string,
        fees: fd.get('fees') ? Number(fd.get('fees')) : undefined,
      });
      
      if (r.success) { 
        toast('success', 'PV enregistré.'); 
        router.push('/dashboard/constats'); 
        router.refresh(); 
      } else {
        toast('error', r.error ?? 'Erreur');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ... (Reste du JSX inchangé) ... */}
      <div className="space-y-1.5">
        <label htmlFor={`${fid}-t`} className="block text-sm font-medium text-slate-700">Intitulé <span className="text-red-500">*</span></label>
        <input id={`${fid}-t`} name="title" type="text" required defaultValue={initialData?.title ?? ''} disabled={isPending} className={cls} placeholder="Ex : Constat d'affichage — Parcelle 204" />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-rt`} className="block text-sm font-medium text-slate-700">Type <span className="text-red-500">*</span></label>
          <select id={`${fid}-rt`} name="report_type" required disabled={isPending} className={cls} defaultValue={initialData?.report_type ?? 'constat'}>
            {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-num`} className="block text-sm font-medium text-slate-700">N° PV</label>
          <input id={`${fid}-num`} name="report_number" type="text" defaultValue={initialData?.report_number ?? ''} disabled={isPending} className={cls} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-rd`} className="block text-sm font-medium text-slate-700">Date</label>
          <input id={`${fid}-rd`} name="report_date" type="date" defaultValue={initialData?.report_date ?? new Date().toISOString().split('T')[0]} disabled={isPending} className={cls} />
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

      <div className="space-y-1.5">
        <label htmlFor={`${fid}-loc`} className="block text-sm font-medium text-slate-700">Lieu / Adresse</label>
        <input id={`${fid}-loc`} name="location" type="text" defaultValue={initialData?.location ?? ''} disabled={isPending} className={cls} placeholder="Quartier, rue, numéro" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-lat`} className="block text-sm font-medium text-slate-700">GPS Latitude</label>
          <input id={`${fid}-lat`} name="gps_lat" type="number" step="0.0000001" defaultValue={initialData?.gps_lat ?? ''} disabled={isPending} className={cls} placeholder="13.5116" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-lng`} className="block text-sm font-medium text-slate-700">GPS Longitude</label>
          <input id={`${fid}-lng`} name="gps_lng" type="number" step="0.0000001" defaultValue={initialData?.gps_lng ?? ''} disabled={isPending} className={cls} placeholder="2.1254" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${fid}-desc`} className="block text-sm font-medium text-slate-700">Corps du rapport</label>
        <textarea id={`${fid}-desc`} name="description" rows={5} defaultValue={initialData?.description ?? ''} disabled={isPending} className={cls} placeholder="Description détaillée du constat…" />
      </div>

      <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-400">Signification</legend>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input name="served" type="checkbox" defaultChecked={initialData?.served ?? false} className="rounded border-slate-300" />
          Signifié / Remis
        </label>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-sto`} className="block text-sm font-medium text-slate-700">Remis à</label>
          <input id={`${fid}-sto`} name="served_to" type="text" defaultValue={initialData?.served_to ?? ''} disabled={isPending} className={cls} placeholder="Nom de la personne" />
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor={`${fid}-fees`} className="block text-sm font-medium text-slate-700">Honoraires (FCFA)</label>
        <input id={`${fid}-fees`} name="fees" type="number" min="0" defaultValue={initialData?.fees ?? ''} disabled={isPending} className={cls} />
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
