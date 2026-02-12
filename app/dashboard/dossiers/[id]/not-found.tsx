// ============================================================
// NumaLex — Page 404 pour un dossier introuvable
// Route : /dashboard/dossiers/[id] (not-found)
// ============================================================

import Link from 'next/link';

export default function DossierNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-400"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M8 11h6" />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">
        Dossier introuvable
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Ce dossier n'existe pas ou vous n'avez pas les droits pour y accéder.
      </p>
      <Link
        href="/dashboard/dossiers"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
      >
        ← Retour aux dossiers
      </Link>
    </div>
  );
}
