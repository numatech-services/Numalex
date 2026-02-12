// ============================================================
// NumaLex — Dashboard Layout (Server Component)
// Récupère le profil puis rend le Sidebar (Client) + ToastProvider
// ============================================================

import { redirect } from 'next/navigation';
import { fetchCurrentProfile } from '@/lib/queries/matters';
import { Sidebar } from '@/components/dashboard/sidebar';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { GlobalSearch } from '@/components/dashboard/global-search';
import { ToastProvider } from '@/components/ui/toast';

const ROLE_LABELS: Record<string, string> = {
  avocat: 'Avocat',
  huissier: 'Huissier',
  notaire: 'Notaire',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile;
  try {
    profile = await fetchCurrentProfile();
  } catch {
    redirect('/login');
  }

  const userName = profile.full_name ?? profile.phone ?? 'Utilisateur';
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role;

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar avec navigation active + mobile */}
        <Sidebar userName={userName} userRole={profile.role} roleLabel={roleLabel} />

        {/* Zone principale */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
            <div className="w-10 lg:hidden" />
            <div className="hidden flex-1 sm:block">
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 sm:block">
                {roleLabel}
              </span>
              <LogoutButton />
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
