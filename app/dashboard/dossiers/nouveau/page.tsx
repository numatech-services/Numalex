// ============================================================
// NumaLex — Page : Créer un nouveau dossier
// Route : /dashboard/dossiers/nouveau
// Server Component
// ============================================================

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { fetchCurrentProfile } from '@/lib/queries/matters';
import { fetchCabinetClients } from '@/lib/queries/matters-detail';
import { MatterForm } from '@/components/matters/matter-form';

export const metadata = {
  title: 'Nouveau dossier — NumaLex',
};

export default async function NouveauDossierPage() {
  // ── Auth + Profil ──
  let profile;
  try {
    profile = await fetchCurrentProfile();
  } catch {
    redirect('/login');
  }

  // ── Clients du cabinet (pour le select) ──
  const clients = await fetchCabinetClients();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/dashboard/dossiers"
          className="transition-colors hover:text-slate-900"
        >
          Dossiers
        </Link>
        <ChevronRight />
        <span className="text-slate-900">Nouveau</span>
      </nav>

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Créer un dossier
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Remplissez les informations pour ouvrir un nouveau dossier.
        </p>
      </div>

      {/* Formulaire en mode création */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <MatterForm role={profile.role} clients={clients} />
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-300"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}
