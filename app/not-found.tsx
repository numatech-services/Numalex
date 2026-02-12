import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <p className="text-7xl font-bold text-slate-200">404</p>
      <h1 className="mt-4 text-lg font-semibold text-slate-900">Page introuvable</h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          Accueil
        </Link>
        <Link href="/dashboard" className="inline-flex h-10 items-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
