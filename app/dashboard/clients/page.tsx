// ============================================================
// NumaLex — Page : Liste des Clients
// Route : /dashboard/clients
// ============================================================

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';

export const metadata = { title: 'Clients' };

export default async function ClientsPage() {
  let profile;
  try {
    profile = await fetchCurrentProfile();
  } catch {
    redirect('/login');
  }

  const supabase = createClient();
  const { data: clients, count } = await supabase
    .from('clients')
    .select('id, full_name, client_type, phone, email, created_at', { count: 'exact' })
    .order('full_name', { ascending: true })
    .limit(100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">
            {count ?? 0} client{(count ?? 0) > 1 ? 's' : ''} dans votre cabinet
          </p>
        </div>
        <Link
          href="/dashboard/clients/nouveau"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nouveau client
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {clients && clients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5 font-medium">Nom</th>
                  <th className="px-5 py-3.5 font-medium">Type</th>
                  <th className="hidden px-5 py-3.5 font-medium sm:table-cell">Téléphone</th>
                  <th className="hidden px-5 py-3.5 font-medium md:table-cell">Email</th>
                  <th className="px-5 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clients.map((client) => (
                  <tr key={client.id} className="group transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/clients/${client.id}`} className="font-medium text-slate-900 group-hover:text-slate-700">
                        {client.full_name}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        client.client_type === 'morale'
                          ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                          : 'bg-slate-50 text-slate-600 ring-slate-500/20'
                      }`}>
                        {client.client_type === 'morale' ? 'Morale' : 'Physique'}
                      </span>
                    </td>
                    <td className="hidden px-5 py-4 text-slate-500 sm:table-cell">{client.phone ?? '—'}</td>
                    <td className="hidden px-5 py-4 text-slate-500 md:table-cell">{client.email ?? '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-700">Aucun client</p>
              <p className="mt-1 text-sm text-slate-500">Ajoutez votre premier client pour commencer.</p>
            </div>
            <Link
              href="/dashboard/clients/nouveau"
              className="mt-2 inline-flex h-9 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              Ajouter un client
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
