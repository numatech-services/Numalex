import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';

export const metadata = { title: 'Agenda' };

const TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  audience: { label: 'Audience', cls: 'bg-red-50 text-red-700 ring-red-600/20' },
  rdv: { label: 'RDV', cls: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  deadline: { label: 'Échéance', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  autre: { label: 'Autre', cls: 'bg-slate-50 text-slate-600 ring-slate-500/20' },
};

export default async function AgendaPage() {
  let profile;
  try { profile = await fetchCurrentProfile(); } catch { redirect('/login'); }

  const supabase = createClient();
  const { data: events, count } = await supabase
    .from('events')
    .select('id, title, event_type, starts_at, ends_at, location, matter:matters!events_matter_id_fkey(id,title)', { count: 'exact' })
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(50);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agenda</h1>
          <p className="mt-1 text-sm text-slate-500">{count ?? 0} événement{(count ?? 0) > 1 ? 's' : ''} à venir</p>
        </div>
        <Link href="/dashboard/agenda/nouveau" className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nouvel événement
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {events && events.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {events.map((ev) => {
              const cfg = TYPE_CONFIG[ev.event_type] ?? TYPE_CONFIG.autre;
              return (
                <Link key={ev.id} href={`/dashboard/agenda/${ev.id}`} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50/60">
                  <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 text-center">
                    <span className="text-[10px] font-semibold uppercase text-slate-500">{fmtM(ev.starts_at)}</span>
                    <span className="text-lg font-bold leading-none text-slate-900">{fmtD(ev.starts_at)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{ev.title}</p>
                      <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-500">
                      <span>{fmtT(ev.starts_at)}{ev.ends_at ? ` — ${fmtT(ev.ends_at)}` : ''}</span>
                      {ev.location && <span>📍 {ev.location}</span>}
                      {ev.matter?.title && <span>Dossier : {ev.matter?.title}</span>}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-1 flex-shrink-0 text-slate-300"><path d="M9 18l6-6-6-6" /></svg>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
            <p className="font-medium text-slate-700">Aucun événement à venir</p>
            <Link href="/dashboard/agenda/nouveau" className="mt-2 inline-flex h-9 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800">Planifier un événement</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function fmtM(d: string) { try { return new Intl.DateTimeFormat('fr', { month: 'short' }).format(new Date(d)); } catch { return ''; } }
function fmtD(d: string) { try { return new Intl.DateTimeFormat('fr', { day: 'numeric' }).format(new Date(d)); } catch { return ''; } }
function fmtT(d: string) { try { return new Intl.DateTimeFormat('fr', { hour: '2-digit', minute: '2-digit' }).format(new Date(d)); } catch { return ''; } }
