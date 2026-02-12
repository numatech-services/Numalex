// ============================================================
// NumaLex — Loading state au niveau de la route /dashboard/dossiers
// Affiché automatiquement par Next.js pendant le chargement de page.tsx
// ============================================================

import { MattersTableSkeleton } from '@/components/matters/matters-table-skeleton';

export default function DossiersLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* En-tête skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-32 animate-pulse rounded-md bg-slate-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200" />
      </div>

      <MattersTableSkeleton />
    </div>
  );
}
