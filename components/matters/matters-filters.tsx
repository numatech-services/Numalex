// ============================================================
// NumaLex — Barre de recherche et filtres (Client Component)
// ============================================================

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useTransition } from 'react';
import type { MatterStatus } from '@/types';

const STATUS_OPTIONS: { value: '' | MatterStatus; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ouvert', label: 'Ouvert' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'suspendu', label: 'Suspendu' },
  { value: 'clos', label: 'Clos' },
  { value: 'archive', label: 'Archivé' },
];

export function MattersFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get('q') ?? '';
  const currentStatus = searchParams.get('status') ?? '';
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Appliquer les mises à jour
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Reset à la page 1 quand on filtre
      params.set('page', '1');

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  /** Debounce la recherche de 350ms pour éviter le spam serveur */
  const handleSearchChange = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateParams({ q: value });
      }, 350);
    },
    [updateParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
      {/* Recherche */}
      <div className="relative flex-1 min-w-[240px] max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Rechercher un dossier…"
          defaultValue={currentSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      {/* Filtre par statut */}
      <select
        value={currentStatus}
        onChange={(e) => updateParams({ status: e.target.value })}
        className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 transition-colors focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Indicateur de chargement */}
      {isPending && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      )}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="4" />
      <path d="M13 13l-3-3" />
    </svg>
  );
}
