import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';

export const metadata = { title: 'Actes notariés' };

const AT: Record<string, string> = { 
  vente_immobiliere: 'Vente', donation: 'Donation', testament: 'Testament', 
  constitution_societe: 'Constitution', bail: 'Bail', procuration: 'Procuration', 
  certificat_heritage: 'Hérédité', acte_notoriete: 'Notoriété', autre: 'Autre' 
};

export default async function NotaryActsPage() {
  let profile; 
  try { 
    profile = await fetchCurrentProfile(); 
  } catch { 
    redirect('/login'); 
  }
  
  if (profile.role !== 'notaire') redirect('/dashboard');

  const supabase = createClient();
  
  // Correction : Typage explicite ': { data: any[] | null, count: number | null }'
  const { data: acts, count }: { data: any[] | null, count: number | null } = await supabase
    .from('notary_acts')
    .select('id, title, act_type, act_number, act_date, signed, notary_fees, client:clients!notary_acts_client_id_fkey(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Actes notariés</h1>
          <p className="mt-1 text-sm text-slate-500">{count ?? 0} acte{(count ?? 0) > 1 ? 's' : ''} dans le répertoire</p>
        </div>
        <Link href="/dashboard/actes/nouveau" className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800">+ Nouvel acte</Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {acts && acts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">N°</th>
                  <th className="px-5 py-3.5">Intitulé</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {acts.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-mono text-xs">{a.act_number ?? '—'}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{a.title}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {AT[a.act_type] ?? a.act_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {(a.client as {full_name:string}|null)?.full_name ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      {a.signed ? (
                        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Signé</span>
                      ) : (
                        <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">En cours</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-slate-400">Aucun acte dans le répertoire</div>
        )}
      </div>
    </div>
  );
}
