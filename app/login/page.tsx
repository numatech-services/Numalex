// ============================================================
// NumaLex — Page de Connexion
// Route : /login
//
// Deux onglets :
//   1. Email + Mot de passe
//   2. Téléphone + Code SMS (OTP)
//
// Server Component qui rend le LoginForm (Client Component).
// ============================================================

import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Connexion — NumaLex',
  description: 'Connectez-vous à votre espace NumaLex',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      {/* Fond subtil */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-slate-200/40 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-slate-100/60 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Marque */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 shadow-lg">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            NumaLex
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Votre espace juridique professionnel
          </p>
        </div>

        {/* Carte de connexion */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
          <LoginForm />
        </div>

        {/* Pied de page */}
        <p className="mt-6 text-center text-xs text-slate-400">
          En vous connectant, vous acceptez les{' '}
          <a href="/cgu" className="underline underline-offset-2 hover:text-slate-600">
            conditions d'utilisation
          </a>{' '}
          de NumaLex.
        </p>
      </div>
    </div>
  );
}
