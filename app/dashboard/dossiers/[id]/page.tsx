// ============================================================
// NumaLex — Page : Détail / Édition d'un dossier
// Route : /dashboard/dossiers/[id]
// Server Component
//
// Récupère le dossier, vérifie l'appartenance au cabinet,
// puis affiche le formulaire pré-rempli en mode édition.
// ============================================================

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { fetchCurrentProfile } from '@/lib/queries/matters';
import {
  fetchMatterById,
  fetchCabinetClients,
} from '@/lib/queries/matters-detail';
import { MatterForm } from '@/components/matters/matter-form';
import { StatusBadge } from '@/components/matters/status-badge';
import { DeleteMatterButton } from '@/components/matters/delete-matter-button';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  // Titre dynamique — on ne re-fetch pas, juste un fallback
  return {
    title: `Dossier ${params.id.slice(0, 8)}… — NumaLex`,
  };
}

// ============================================================

interface PageProps {
  params: { id: string };
}

export default async function DossierDetailPage({ params }: PageProps) {
  const { id } = params;

  // ── 1. Authentification ──
  let profile;
  try {
    profile = await fetchCurrentProfile();
  } catch {
    redirect('/login');
  }

  // ── 2. Charger le dossier + vérifier le cabinet ──
  const [matter, clients] = await Promise.all([
    fetchMatterById(id, profile.cabinet_id),
    fetchCabinetClients(),
  ]);

  // Dossier inexistant ou pas dans le cabinet → 404
  if (!matter) {
    notFound();
  }

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
        <span className="max-w-[200px] truncate text-slate-900">
          {matter.title}
        </span>
      </nav>

      {/* En-tête avec statut */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {matter.title}
            </h1>
            <StatusBadge status={matter.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {matter.reference && (
              <span className="font-mono text-xs">
                Réf. {matter.reference}
              </span>
            )}
            {matter.client?.full_name && (
              <span>Client : {matter.client.full_name}</span>
            )}
            {matter.opened_at && (
              <span>Ouvert le {formatDate(matter.opened_at)}</span>
            )}
          </div>
        </div>
        <DeleteMatterButton matterId={matter.id} matterTitle={matter.title} />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <MatterForm
          role={profile.role}
          clients={clients}
          initialData={matter}
        />
      </div>
    </div>
  );
}

// ============================================================
// Utilitaires
// ============================================================

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat(['fr-NE', 'fr-FR', 'fr', 'en'], {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
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
