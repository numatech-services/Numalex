import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Mes factures — Espace Client' };

const ST: Record<string, { l: string; c: string }> = {
  brouillon: { l: 'Brouillon', c: 'bg-slate-100 text-slate-500' },
  envoyee: { l: 'Envoyée', c: 'bg-blue-50 text-blue-700' },
  payee: { l: 'Payée', c: 'bg-emerald-50 text-emerald-700' },
  en_retard: { l: 'En retard', c: 'bg-red-50 text-red-700' },
  annulee: { l: 'Annulée', c: 'bg-gray-50 text-gray-400' },
};

export default async function ClientInvoicesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 1. Correction du typage access
  const { data: access }: { data: any } = await supabase
    .from('client_portal_access')
    .select('client_id')
    .eq('auth_user_id', user.id)
    .eq('active', true)
    .single();

  if (!access) redirect('/login');

  // 2. Correction du typage invoices pour autoriser le .map() et l'accès aux propriétés
  const { data: invoices }: { data: any[] | null } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_ttc, status, due_at')
    .eq('client_id', access.client_id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Mes factures</h1>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {invoices && invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">N°</th>
                  <th className="px-5 py-3.5 text-right">TTC</th>
                  <th className="px-5 py-3.5">Échéance</th>
                  <th className="px-5 py-3.5">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv: any) => {
                  const st = ST[inv.status] ?? ST.brouillon;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-medium">
                        {inv.total_ttc ? new Intl.NumberFormat('fr-FR').format(inv.total_ttc) + ' F CFA' : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{inv.due_at ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={"rounded-lg px-2 py-0.5 text-xs font-semibold " + st.c}>
                          {st.l}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-slate-400">Aucune facture</div>
        )}
      </div>
    </div>
  );
}
