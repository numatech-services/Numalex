'use client';

import { useEffect } from 'react';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Dashboard Error]', error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">⚠️</div>
      <h2 className="mt-4 text-lg font-bold text-slate-900">Quelque chose ne va pas</h2>
      <p className="mt-2 text-sm text-slate-500">{error.message || 'Une erreur est survenue dans le tableau de bord.'}</p>
      <button onClick={reset} className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">Réessayer</button>
    </div>
  );
}
