import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';

export const metadata = { title: 'Procès-verbaux & Constats' };

const RT: Record<string, string> = { constat: 'Constat', signification: 'Signification', saisie: 'Saisie', expulsion: 'Expulsion', inventaire: 'Inventaire', sommation: 'Sommation', autre: 'Autre' };

export default async function BailiffReportsPage() {
  let profile; 
  try { 
    profile = await fetchCurrentProfile(); 
  } catch { 
    redirect('/login'); 
  }
  
  if (profile.role !== 'huissier') redirect('/dashboard');

  const supabase = createClient();
  
  // Correction : Ajout du typage explicite pour éviter l'erreur 'never'
  const { data: reports, count }: { data: any[] | null, count: number | null } = await supabase
    .from('bailiff_reports')
    .select('id, title, report_type, report_number, report_date, served, location, fees, client:clients!bailiff_reports_client_id_fkey(full_name)', { count: 'exact' })
    .order('report_date', { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Procès-verbaux & Constats</h1>
          <p className="mt-1 text-sm text-slate-500">{count ?? 0} PV dans le registre</p>
        </div>
        <Link href="/dashboard/constats/nouveau" className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800">+ Nouveau PV</Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {reports && reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">N°</th>
                  <th className="px-5 py-3.5">Intitulé</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Lieu</th>
                  <th className="px-5 py-3.5">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-mono text-xs">{r.report_number ?? '—'}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{r.title}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-lg bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                        {RT[r.report_type] ?? r.report_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{r.location ?? '—'}</td>
                    <td className="px-5 py-3">
                      {r.served ? (
                        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Signifié</span>
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">En cours</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-slate-400">Aucun procès-verbal</div>
        )}
      </div>
    </div>
  );
}
