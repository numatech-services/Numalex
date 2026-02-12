'use client';

export default function ClientError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-4xl">⚠️</p>
      <h2 className="mt-4 font-bold text-slate-900">Une erreur est survenue</h2>
      <p className="mt-2 text-sm text-slate-500">{error.message || 'Impossible de charger cette page.'}</p>
      <button onClick={reset} className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
        Réessayer
      </button>
    </div>
  );
}
