import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';
import { UploadForm } from '@/components/documents/upload-form';

export const metadata = { title: 'Nouveau document' };

export default async function UploadDocPage() {
  let profile;
  try { profile = await fetchCurrentProfile(); } catch { redirect('/login'); }

  const supabase = createClient();
  const { data: matters } = await supabase.from('matters').select('id, title').order('title');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/documents" className="hover:text-slate-900">Documents</Link>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300"><path d="M6 4l4 4-4 4" /></svg>
        <span className="text-slate-900">Téléverser</span>
      </nav>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">Téléverser un document</h1>
        <p className="mt-1 text-sm text-slate-500">Le fichier sera stocké de manière sécurisée dans votre espace cabinet.</p>
        <div className="mt-6"><UploadForm matters={matters ?? []} /></div>
      </div>
    </div>
  );
}
