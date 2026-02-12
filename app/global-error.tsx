'use client';

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string; statusCode?: number };
  reset: () => void;
}

const ERROR_MAP: Record<number, { title: string; message: string; icon: string }> = {
  401: { title: 'Session expirée', message: 'Votre session a expiré. Veuillez vous reconnecter.', icon: '🔒' },
  403: { title: 'Accès refusé', message: 'Vous n\'avez pas les permissions nécessaires.', icon: '🚫' },
  404: { title: 'Page introuvable', message: 'La page demandée n\'existe pas.', icon: '🔍' },
  429: { title: 'Trop de requêtes', message: 'Veuillez patienter avant de réessayer.', icon: '⏳' },
  500: { title: 'Erreur serveur', message: 'Une erreur interne est survenue. Nos équipes sont informées.', icon: '⚠️' },
};

function getErrorInfo(error: Props['error']) {
  const code = error.statusCode ?? 500;
  return ERROR_MAP[code] ?? ERROR_MAP[500];
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Log structuré — jamais de détails techniques en prod
    console.error(JSON.stringify({
      type: 'GLOBAL_ERROR',
      digest: error.digest,
      message: process.env.NODE_ENV === 'production' ? '[redacted]' : error.message,
      timestamp: new Date().toISOString(),
    }));
  }, [error]);

  const info = getErrorInfo(error);

  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="text-4xl">{info.icon}</span>
          <h1 className="mt-4 text-lg font-bold text-slate-900">{info.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{info.message}</p>
          {process.env.NODE_ENV !== 'production' && (
            <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-red-50 p-3 text-left text-xs text-red-700">{error.message}</pre>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <a href="/" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Accueil</a>
            <button onClick={reset} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">Réessayer</button>
          </div>
        </div>
      </body>
    </html>
  );
}
