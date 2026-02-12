// ============================================================
// NumaLex — Tableau de bord principal
// Route : /dashboard
// ============================================================

import { redirect } from 'next/navigation';
import { fetchCurrentProfile } from '@/lib/queries/matters';
import {
  fetchDashboardKpis,
  fetchRecentMatters,
  fetchTodayEvents,
  fetchRecentAlerts,
  fetchPendingTasks,
  fetchRecentDocuments,
} from '@/lib/queries/dashboard';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { RecentMatters } from '@/components/dashboard/recent-matters';
import { TodayAgenda } from '@/components/dashboard/today-agenda';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { TasksList } from '@/components/dashboard/tasks-list';
import { OpenDocuments } from '@/components/dashboard/open-documents';

export const metadata = { title: 'Tableau de bord' };

export default async function DashboardPage() {
  let profile;
  try {
    profile = await fetchCurrentProfile();
  } catch {
    redirect('/login');
  }

  // Charger toutes les données en parallèle — filtrage cabinet_id explicite
  const cid = profile.cabinet_id;
  const [kpis, recentMatters, todayEvents, alerts, tasks, documents] = await Promise.all([
    fetchDashboardKpis(cid),
    fetchRecentMatters(cid),
    fetchTodayEvents(cid),
    fetchRecentAlerts(cid),
    fetchPendingTasks(cid),
    fetchRecentDocuments(cid),
  ]);

  const greeting = getGreeting();
  const displayName = profile.full_name?.split(' ')[0] ?? 'Maître';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {greeting}, {displayName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Voici le résumé de votre cabinet pour aujourd'hui.
        </p>
      </div>

      {/* KPIs */}
      <KpiCards kpis={kpis} />

      {/* Ligne 1 : Dossiers récents + Agenda + Alertes */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <RecentMatters matters={recentMatters ?? []} />
        <TodayAgenda events={todayEvents ?? []} />
        <AlertsPanel alerts={alerts ?? []} />
      </div>

      {/* Ligne 2 : Documents + Tâches */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <OpenDocuments documents={documents ?? []} />
        <TasksList tasks={tasks ?? []} />
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}
