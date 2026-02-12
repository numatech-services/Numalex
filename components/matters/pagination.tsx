// ============================================================
// NumaLex — Composant de pagination (Client Component)
// Utilise les searchParams de l'URL pour la pagination serveur.
// ============================================================

'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { PaginationMeta } from '@/types';

interface PaginationProps {
  pagination: PaginationMeta;
}

export function Pagination({ pagination }: PaginationProps) {
  const { page, totalPages, total, pageSize } = pagination;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  /**
   * Génère l'URL pour une page donnée en préservant les autres paramètres.
   */
  function buildPageUrl(targetPage: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(targetPage));
    return `${pathname}?${params.toString()}`;
  }

  /**
   * Calcule les numéros de page à afficher.
   * Affiche au maximum 5 pages avec ellipses si nécessaire.
   */
  function getPageNumbers(): (number | 'ellipsis')[] {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    // Toujours afficher la première page
    pages.push(1);

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis');

    // Toujours afficher la dernière page
    pages.push(totalPages);

    return pages;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
      {/* Compteur */}
      <p className="text-sm text-slate-500">
        <span className="font-medium text-slate-700">{from}–{to}</span> sur{' '}
        <span className="font-medium text-slate-700">{total}</span> dossier{total > 1 ? 's' : ''}
      </p>

      {/* Navigation */}
      <nav className="flex items-center gap-1" aria-label="Pagination">
        {/* Précédent */}
        {page > 1 ? (
          <Link
            href={buildPageUrl(page - 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Page précédente"
          >
            <ChevronLeftIcon />
          </Link>
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-200">
            <ChevronLeftIcon />
          </span>
        )}

        {/* Numéros de page */}
        {getPageNumbers().map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-9 w-9 items-center justify-center text-sm text-slate-400"
            >
              …
            </span>
          ) : (
            <Link
              key={item}
              href={buildPageUrl(item)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                item === page
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </Link>
          )
        )}

        {/* Suivant */}
        {page < totalPages ? (
          <Link
            href={buildPageUrl(page + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Page suivante"
          >
            <ChevronRightIcon />
          </Link>
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-200">
            <ChevronRightIcon />
          </span>
        )}
      </nav>
    </div>
  );
}

// ---- Icônes inline (pas de dépendance externe) ----

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 12L6 8l4-4" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}
