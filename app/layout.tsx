// ============================================================
// NumaLex — Root Layout
//
// FIX S6 : Le projet n'avait pas de layout racine.
// Sans ce fichier, pas de <html>, pas de <head>, pas de polices,
// pas de meta tags, pas de favicon.
// ============================================================

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { validateEnv } from '@/lib/env';

// Valider les variables d'environnement au démarrage (serveur uniquement)
if (typeof window === 'undefined') {
  validateEnv();
}
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'NumaLex — Gestion juridique professionnelle',
    template: '%s — NumaLex',
  },
  description:
    'Plateforme de gestion de dossiers, clients et facturation pour avocats, notaires et huissiers au Niger (Zone OHADA).',
  keywords: ['juridique', 'avocat', 'notaire', 'huissier', 'Niger', 'OHADA', 'SaaS', 'dossiers'],
  robots: {
    index: false,      // Dashboard privé — pas d'indexation
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
