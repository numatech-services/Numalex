import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';

export const metadata = { title: 'Suivi du temps' };

export default async function TimeEntriesPage() {
  let profile; try { profile = await fetchCurrentProfile(); } catch { redirect('/login'); }
  if (profile.role !== 'avocat') redirect('/dashboard');

  const supabase = createClient();
  const { data: entries, count } = await supabase
    .from('time_entries')
    .select('id, minutes, description, entry_date, hourly_rate, amount, billable, invoiced, matter:matters!time_entries_matter_id_fkey(id,title)', { count: 'exact' })
    .order('entry_date', { ascending: false })
    .limit(50);

  const totalMinutes = (entries ?? []).reduce((s, e) => s + (e.minutes ?? 0), 0);
  const totalAmount = (entries ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Suivi du temps</h1>
          <p className="mt-1 text-sm text-slate-500">
            {count ?? 0} entrées — {Math.floor(totalMinutes/60)}h{String(totalMinutes%60).padStart(2,'0')} total
            {totalAmount > 0 && ` — ${new Intl.NumberFormat('fr-FR').format(totalAmount)} FCFA`}
          </p>
        </div>
        <Link href="/dashboard/temps/nouveau" className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
          + Nouvelle entrée
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {entries && entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5 font-medium">Date</th>
                <th className="px-5 py-3.5 font-medium">Dossier</th>
                <th className="px-5 py-3.5 font-medium">Description</th>
                <th className="px-5 py-3.5 font-medium text-right">Durée</th>
                <th className="px-5 py-3.5 font-medium text-right">Montant</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {entries.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 text-xs text-slate-500">{e.entry_date}</td>
                    <td className="px-5 py-3 text-slate-700">{e.matter?.title ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-900">{e.description}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-900">{Math.floor(e.minutes/60)}h{String(e.minutes%60).padStart(2,'0')}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-900">{e.amount ? new Intl.NumberFormat('fr-FR').format(e.amount) + ' F' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-slate-400">Aucune entrée de temps</div>
        )}
      </div>
    </div>
  );
}
