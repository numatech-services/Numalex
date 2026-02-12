import type { DashboardKpis } from '@/lib/queries/dashboard';

const fmtCFA = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

interface KpiCardData {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  const cards: KpiCardData[] = [
    { label: 'Dossiers actifs', value: kpis.activeMatters, icon: '📂', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-600' },
    { label: 'Urgents', value: kpis.urgentMatters, icon: '🔥', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-500' },
    { label: 'Impayés (FCFA)', value: fmtCFA(kpis.unpaidTotal), icon: '💰', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-500' },
    { label: "Événements aujourd'hui", value: kpis.todayEvents, icon: '📅', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-500' },
    { label: 'Tâches en cours', value: kpis.pendingTasks, icon: '✅', color: 'text-violet-700', bgColor: 'bg-violet-50', borderColor: 'border-violet-500' },
    { label: 'Alertes', value: kpis.unreadAlerts, icon: '🔔', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border-l-4 ${card.borderColor} ${card.bgColor} p-4 shadow-sm transition-shadow hover:shadow-md`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{card.label}</p>
            <span className="text-lg">{card.icon}</span>
          </div>
          <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
