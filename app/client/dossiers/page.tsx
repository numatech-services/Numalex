import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Mes dossiers — Espace Client' };

const ST: Record<string, { label: string; cls: string }> = {
  ouvert: { label: 'Ouvert', cls: 'bg-blue-50 text-blue-700' },
  en_cours: { label: 'En cours', cls: 'bg-emerald-50 text-emerald-700' },
  suspendu: { label: 'Suspendu', cls: 'bg-amber-50 text-amber-700' },
  clos: { label: 'Clôturé', cls: 'bg-slate-100 text-slate-500' },
  archive: { label: 'Archivé', cls: 'bg-gray-50 text-gray-400' },
};

export default async function ClientMattersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: access } = await supabase.from('client_portal_access').select('client_id').eq('auth_user_id', user.id).eq('active', true).single();
  if (!access) redirect('/login');

  const { data: matters } = await supabase
    .from('matters')
    .select('id, title, reference, status, opened_at, updated_at')
    .eq('client_id', access.client_id)
    .order('updated_at', { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Mes dossiers</h1>
      <p className="mt-1 text-sm text-slate-500">{matters?.length ?? 0} dossier{(matters?.length ?? 0) > 1 ? 's' : ''}</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {matters && matters.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {matters.map((m) => {
              const st = ST[m.status] ?? { label: m.status, cls: 'bg-slate-100 text-slate-600' };
              return (
                <div key={m.id} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50/60">
                  <div>
                    <p className="font-medium text-slate-900">{m.title}</p>
                    <div className="mt-0.5 flex gap-3 text-xs text-slate-400">
                      {m.reference && <span className="font-mono">{m.reference}</span>}
                      {m.opened_at && <span>Ouvert le {m.opened_at}</span>}
                    </div>
                  </div>
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-slate-400">Aucun dossier</div>
        )}
      </div>
    </div>
  );
}
