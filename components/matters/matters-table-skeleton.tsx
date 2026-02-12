// ============================================================
// NumaLex — Skeleton de chargement pour la table des dossiers
// ============================================================

function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="h-4 rounded-md bg-slate-200"
            style={{ width: `${55 + Math.random() * 35}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

interface MattersTableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function MattersTableSkeleton({
  columns = 6,
  rows = 5,
}: MattersTableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Barre de filtres skeleton */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-200" />
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
        <div className="flex gap-2">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
