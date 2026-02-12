// ============================================================
// NumaLex — Table des dossiers (Server Component)
// Adapte les colonnes selon le rôle de l'utilisateur :
//   • avocat   → affiche "Juridiction"
//   • huissier → affiche "Date de signification"
//   • notaire  → colonnes standards
// ============================================================

import Link from 'next/link';
import type { Matter, UserRole } from '@/types';
import { StatusBadge } from './status-badge';

interface MattersTableProps {
  matters: Matter[];
  role: UserRole;
}

export function MattersTable({ matters, role }: MattersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
            <th className="px-4 py-3 font-medium">Référence</th>
            <th className="px-4 py-3 font-medium">Titre</th>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Statut</th>

            {/* ── Colonne conditionnelle selon le rôle ── */}
            {role === 'avocat' && (
              <th className="px-4 py-3 font-medium">Juridiction</th>
            )}
            {role === 'huissier' && (
              <th className="px-4 py-3 font-medium">Date signif.</th>
            )}

            <th className="px-4 py-3 font-medium">Ouvert le</th>
            <th className="px-4 py-3 font-medium">Responsable</th>
            <th className="px-4 py-3 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-50">
          {matters.map((matter) => (
            <tr
              key={matter.id}
              className="group transition-colors hover:bg-slate-50/60"
            >
              {/* Référence */}
              <td className="px-4 py-3.5">
                <span className="font-mono text-xs text-slate-500">
                  {matter.reference ?? '—'}
                </span>
              </td>

              {/* Titre (lien vers le détail) */}
              <td className="px-4 py-3.5">
                <Link
                  href={`/dashboard/dossiers/${matter.id}`}
                  className="font-medium text-slate-900 underline-offset-4 group-hover:underline"
                >
                  {matter.title}
                </Link>
                {matter.parties_adverses && (
                  <p className="mt-0.5 text-xs text-slate-400 truncate max-w-[240px]">
                    c/ {matter.parties_adverses}
                  </p>
                )}
              </td>

              {/* Client */}
              <td className="px-4 py-3.5 text-slate-600">
                {matter.client?.full_name ?? (
                  <span className="text-slate-300">—</span>
                )}
              </td>

              {/* Statut */}
              <td className="px-4 py-3.5">
                <StatusBadge status={matter.status} />
              </td>

              {/* ── Valeur conditionnelle selon le rôle ── */}
              {role === 'avocat' && (
                <td className="px-4 py-3.5 text-slate-600">
                  {matter.juridiction ?? (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              )}
              {role === 'huissier' && (
                <td className="px-4 py-3.5 text-slate-600">
                  {matter.date_signification
                    ? formatDate(matter.date_signification)
                    : <span className="text-slate-300">—</span>}
                </td>
              )}

              {/* Date d'ouverture */}
              <td className="px-4 py-3.5 text-slate-500 tabular-nums">
                {matter.opened_at ? formatDate(matter.opened_at) : '—'}
              </td>

              {/* Responsable */}
              <td className="px-4 py-3.5 text-slate-600">
                {matter.assignee?.full_name ?? (
                  <span className="text-slate-300">—</span>
                )}
              </td>

              {/* Actions */}
              <td className="px-4 py-3.5">
                <Link
                  href={`/dashboard/dossiers/${matter.id}`}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700"
                >
                  Ouvrir →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Utilitaire de formatage de date ----

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

/** Locales par ordre de préférence : Niger français → français générique → anglais */
const LOCALE_CHAIN = ['fr-NE', 'fr-FR', 'fr', 'en'];

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;   // Date invalide
    return new Intl.DateTimeFormat(LOCALE_CHAIN, DATE_OPTIONS).format(date);
  } catch {
    return dateStr;
  }
}
