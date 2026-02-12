// ============================================================
// NumaLex — Badge de statut pour les dossiers
// ============================================================

import type { MatterStatus } from '@/types';

const STATUS_CONFIG: Record<MatterStatus, { label: string; classes: string }> = {
  ouvert: {
    label: 'Ouvert',
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  en_cours: {
    label: 'En cours',
    classes: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  suspendu: {
    label: 'Suspendu',
    classes: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  clos: {
    label: 'Clos',
    classes: 'bg-slate-50 text-slate-600 ring-slate-500/20',
  },
  archive: {
    label: 'Archivé',
    classes: 'bg-gray-50 text-gray-500 ring-gray-400/20',
  },
};

interface StatusBadgeProps {
  status: MatterStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
