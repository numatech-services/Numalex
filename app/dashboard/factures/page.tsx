import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';

export const metadata = { title: 'Factures' };

const ST: Record<string, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-slate-50 text-slate-600 ring-slate-500/20' },
  envoyee: { label: 'Envoyée', cls: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  payee: { label: 'Payée', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  en_retard: { label: 'En retard', cls: 'bg-red-50 text-red-700 ring-red-600/20' },
  annulee: { label: 'Annulée', cls: 'bg-gray-50 text-gray-500 ring-gray-400/20' },
};

export default async function FacturesPage() {
  let profile;
  try { profile = await fetchCurrentProfile(); } catch { redirect('/login'); }

  const supabase = createClient();
  const { data: invoices, count } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount_ht, tva_amount, total_ttc, status, due_at, client:clients!invoices_client_id_fkey(id,full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Factures</h1>
          <p className="mt-1 text-sm text-slate-500">{count ?? 0} facture{(count ?? 0) > 1 ? 's' : ''} — TVA Niger 19%</p>
        </div>
        <Link href="/dashboard/factures/nouvelle" className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nouvelle facture
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {invoices && invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5 font-medium">N°</th>
                <th className="px-5 py-3.5 font-medium">Client</th>
                <th className="hidden px-5 py-3.5 font-medium text-right sm:table-cell">HT</th>
                <th className="px-5 py-3.5 font-medium text-right">TTC</th>
                <th className="px-5 py-3.5 font-medium">Statut</th>
                <th className="px-5 py-3.5 font-medium text-right">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => {
                  const st = ST[inv.status] ?? ST.brouillon;
                  return (
                    <tr key={inv.id} className="group transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-4 font-mono text-xs font-medium text-slate-900">{inv.invoice_number}</td>
                      <td className="px-5 py-4 text-slate-600">{inv.client?.full_name ?? '—'}</td>
                      <td className="hidden px-5 py-4 text-right tabular-nums text-slate-900 sm:table-cell">{fmtCFA(inv.amount_ht)}</td>
                      <td className="px-5 py-4 text-right tabular-nums font-medium text-slate-900">{fmtCFA(inv.total_ttc)}</td>
                      <td className="px-5 py-4"><span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${st.cls}`}>{st.label}</span></td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/dashboard/factures/${inv.id}`} className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">Modifier</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" /><path d="M8 10h8" /><path d="M8 14h4" /></svg>
            </div>
            <p className="font-medium text-slate-700">Aucune facture</p>
            <Link href="/dashboard/factures/nouvelle" className="mt-2 inline-flex h-9 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800">Créer une facture</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function fmtCFA(n: number | null) { return n == null ? '—' : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' F'; }
