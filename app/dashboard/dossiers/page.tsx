// ============================================================
// NumaLex — Page "Liste des Dossiers"
// Route : /dashboard/dossiers
// Server Component (Next.js 14 App Router)
// ============================================================

import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { MatterStatus, MattersPageSearchParams } from '@/types';
import { fetchCurrentProfile, fetchMatters } from '@/lib/queries/matters';
import { MattersTable } from '@/components/matters/matters-table';
import { MattersFilters } from '@/components/matters/matters-filters';
import { Pagination } from '@/components/matters/pagination';
import { MattersTableSkeleton } from '@/components/matters/matters-table-skeleton';
import { MattersError } from '@/components/matters/matters-error';
import { MattersEmpty } from '@/components/matters/matters-empty';

// ============================================================
// Metadata
// ============================================================

export const metadata = {
  title: 'Dossiers — NumaLex',
  description: 'Liste des dossiers juridiques de votre cabinet',
};

// ============================================================
// Page principale
// ============================================================

interface PageProps {
  searchParams: MattersPageSearchParams;
}

export default function DossiersPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const status = searchParams.status as MatterStatus | undefined;
  const search = searchParams.q;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ---- En-tête ---- */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dossiers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez les dossiers juridiques de votre cabinet
          </p>
        </div>
        <Link
          href="/dashboard/dossiers/nouveau"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <PlusIcon />
          Nouveau dossier
        </Link>
      </div>

      {/* ---- Contenu avec Suspense ---- */}
      <Suspense
        key={`${page}-${status ?? ''}-${search ?? ''}`}
        fallback={<MattersTableSkeleton />}
      >
        <MattersContent page={page} status={status} search={search} />
      </Suspense>
    </div>
  );
}

// ============================================================
// Composant serveur async qui charge les données
// ============================================================

interface MattersContentProps {
  page: number;
  status?: MatterStatus;
  search?: string;
}

async function MattersContent({ page, status, search }: MattersContentProps) {
  // ---- Authentification & profil ----
  let profile;
  try {
    profile = await fetchCurrentProfile();
  } catch {
    // Non authentifié → redirection
    redirect('/login');
  }

  // ---- Chargement des dossiers ----
  try {
    const { matters, pagination } = await fetchMatters({ page, status, search });

    const hasFilters = Boolean(status || search);

    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Filtres */}
        <MattersFilters />

        {/* Table ou état vide */}
        {matters.length > 0 ? (
          <>
            <MattersTable matters={matters} role={profile.role} />
            <Pagination pagination={pagination} />
          </>
        ) : (
          <MattersEmpty hasFilters={hasFilters} />
        )}
      </div>
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Une erreur inattendue est survenue.';

    return <MattersError message={message} />;
  }
}

// ---- Icône ----

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  );
}
