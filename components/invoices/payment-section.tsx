'use client';

import { useState, useTransition } from 'react';
import { addPayment } from '@/lib/actions/payments';
import { useToast } from '@/components/ui/toast';

const MODES = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'wave', label: 'Wave' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'autre', label: 'Autre' },
];

interface Payment {
  id: string;
  montant: number;
  mode: string;
  reference: string | null;
  statut: string;
  paid_at: string;
}

export function PaymentSection({ factureId, payments }: { factureId: string; payments: Payment[] }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const totalPaid = payments.reduce((s, p) => s + Number(p.montant), 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await addPayment({
        facture_id: factureId,
        montant: Number(fd.get('montant')),
        mode: fd.get('mode') as string,
        reference: fd.get('reference') as string,
      });
      if (r.success) { setOpen(false); toast('success', 'Paiement enregistré.'); }
      else toast('error', r.error ?? 'Erreur');
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Paiements <span className="ml-1 text-xs font-normal text-emerald-600">{fmtCFA(totalPaid)} reçus</span>
        </h3>
        <button onClick={() => setOpen(!open)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
          + Paiement
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Montant (FCFA) *</label>
              <input name="montant" type="number" min="1" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Mode *</label>
              <select name="mode" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Référence</label>
              <input name="reference" type="text" placeholder="N° transaction" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-1.5 text-xs">Annuler</button>
            <button type="submit" disabled={isPending} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50">
              {isPending ? '…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {payments.length > 0 ? (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
              <div>
                <span className="font-medium text-slate-900">{fmtCFA(p.montant)}</span>
                <span className="ml-2 text-xs text-slate-500">{MODES.find(m => m.value === p.mode)?.label ?? p.mode}</span>
                {p.reference && <span className="ml-2 font-mono text-xs text-slate-400">{p.reference}</span>}
              </div>
              <span className="text-xs text-slate-400">{new Date(p.paid_at).toLocaleDateString('fr')}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-slate-400">Aucun paiement enregistré</p>
      )}
    </div>
  );
}

function fmtCFA(n: number) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' FCFA'; }
