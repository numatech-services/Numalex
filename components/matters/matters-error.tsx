// ============================================================
// NumaLex — Composant d'état d'erreur
// ============================================================

interface MattersErrorProps {
  message: string;
}

export function MattersError({ message }: MattersErrorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-red-200 bg-red-50 shadow-sm">
      <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-600"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-red-800">
            Erreur de chargement
          </h3>
          <p className="mt-1 text-sm text-red-600">{message}</p>
        </div>
      </div>
    </div>
  );
}
