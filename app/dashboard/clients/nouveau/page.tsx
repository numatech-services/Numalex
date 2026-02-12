// ============================================================
// NumaLex — Page : Nouveau Client
// Route : /dashboard/clients/nouveau
// ============================================================

import Link from 'next/link';
import { ClientForm } from '@/components/clients/client-form';

export const metadata = { title: 'Nouveau client' };

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/clients" className="transition-colors hover:text-slate-900">Clients</Link>
        <ChevronRight />
        <span className="text-slate-900">Nouveau</span>
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">Nouveau client</h1>
        <p className="mt-1 text-sm text-slate-500">Ajoutez un nouveau client à votre cabinet.</p>
        <div className="mt-6">
          <ClientForm />
        </div>
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}
