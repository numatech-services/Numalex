import Link from 'next/link';

const TYPE_DOTS: Record<string, string> = {
  audience: 'bg-red-500',
  rdv: 'bg-blue-500',
  deadline: 'bg-amber-500',
  autre: 'bg-slate-400',
};

interface Event {
  id: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
}

function fmtTime(d: string) {
  try { return new Intl.DateTimeFormat('fr', { hour: '2-digit', minute: '2-digit' }).format(new Date(d)); }
  catch { return ''; }
}

export function TodayAgenda({ events }: { events: Event[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Agenda du jour</h2>
        <Link href="/dashboard/agenda" className="text-xs font-medium text-blue-600 hover:text-blue-800">Voir tout →</Link>
      </div>
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((ev) => (
            <Link key={ev.id} href={`/dashboard/agenda/${ev.id}`} className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TYPE_DOTS[ev.event_type] ?? TYPE_DOTS.autre}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{ev.title}</p>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">{fmtTime(ev.starts_at)}</span>
                  {ev.location && <span>📍 {ev.location}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-slate-400">Rien de prévu aujourd'hui</p>
      )}
    </div>
  );
}
