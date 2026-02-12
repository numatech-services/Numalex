import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  ouvert: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-emerald-100 text-emerald-700',
  contentieux: 'bg-red-100 text-red-700',
  en_attente: 'bg-amber-100 text-amber-700',
  cloture: 'bg-slate-100 text-slate-500',
  archive: 'bg-gray-100 text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  contentieux: 'Contentieux',
  en_attente: 'En attente',
  cloture: 'Clôturé',
  archive: 'Archivé',
};

interface Matter {
  id: string;
  title: string;
  status: string;
  reference: string | null;
  client: { full_name: string } | null;
  updated_at: string;
}

export function RecentMatters({ matters }: { matters: Matter[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Dossiers récents</h2>
        <Link href="/dashboard/dossiers" className="text-xs font-medium text-blue-600 hover:text-blue-800">Voir tout →</Link>
      </div>
      {matters.length > 0 ? (
        <div className="space-y-3">
          {matters.map((m) => (
            <Link key={m.id} href={`/dashboard/dossiers/${m.id}`} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{m.title}</p>
                <p className="text-xs text-slate-500">{m.client?.full_name ?? 'Sans client'}</p>
              </div>
              <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[m.status] ?? 'bg-slate-100 text-slate-500'}`}>
                {STATUS_LABELS[m.status] ?? m.status}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-slate-400">Aucun dossier récent</p>
      )}
    </div>
  );
}
