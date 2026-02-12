import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';
import { NotaryActForm } from '@/components/metier/notary-act-form';

export const metadata = { title: 'Nouvel acte notarié' };

export default async function NewActPage() {
  let profile; try { profile = await fetchCurrentProfile(); } catch { redirect('/login'); }
  if (profile.role !== 'notaire') redirect('/dashboard');
  const supabase = createClient();
  const [{ data: matters }, { data: clients }] = await Promise.all([
    supabase.from('matters').select('id, title').order('title'),
    supabase.from('clients').select('id, full_name').order('full_name'),
  ]);
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/actes" className="hover:text-slate-900">Actes</Link>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300"><path d="M6 4l4 4-4 4" /></svg>
        <span className="text-slate-900">Nouveau</span>
      </nav>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">Nouvel acte notarié</h1>
        <div className="mt-6"><NotaryActForm matters={matters ?? []} clients={clients ?? []} /></div>
      </div>
    </div>
  );
}
