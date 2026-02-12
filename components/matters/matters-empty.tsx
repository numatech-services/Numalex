// ============================================================
// NumaLex — État vide (aucun dossier trouvé)
// ============================================================

import Link from 'next/link';

interface MattersEmptyProps {
  hasFilters: boolean;
}

export function MattersEmpty({ hasFilters }: MattersEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-400"
        >
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      </div>
      {hasFilters ? (
        <>
          <p className="text-sm text-slate-500">
            Aucun dossier ne correspond à vos critères.
          </p>
          <Link
            href="/dashboard/dossiers"
            className="text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-700"
          >
            Réinitialiser les filtres
          </Link>
        </>
      ) : (
        <>
          <div>
            <p className="font-medium text-slate-700">Aucun dossier</p>
            <p className="mt-1 text-sm text-slate-500">
              Créez votre premier dossier pour commencer.
            </p>
          </div>
          <Link
            href="/dashboard/dossiers/nouveau"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            <span>+</span> Nouveau dossier
          </Link>
        </>
      )}
    </div>
  );
}
