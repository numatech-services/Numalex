import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Mes documents — Espace Client' };

export default async function ClientDocumentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  // Correction : Typage explicite ': { data: any }' pour éviter l'erreur 'never'
  const { data: access }: { data: any } = await supabase
    .from('client_portal_access')
    .select('client_id')
    .eq('auth_user_id', user.id)
    .eq('active', true)
    .single();

  if (!access) redirect('/login');

  // Correction : Typage ': { data: any[] | null }' pour permettre le .map()
  const { data: matters }: { data: any[] | null } = await supabase
    .from('matters')
    .select('id')
    .eq('client_id', access.client_id);

  const ids = (matters ?? []).map(m => m.id);  
  
  let docs: Array<{ 
    id: string; 
    title: string; 
    doc_type: string; 
    file_url: string | null; 
    file_size: number | null; 
    created_at: string; 
    matter: { title: string } | null 
  }> = [];

  if (ids.length > 0) {
    const { data } = await supabase
      .from('documents')
      .select('id, title, doc_type, file_url, file_size, created_at, matter:matters!documents_matter_id_fkey(title)')
      .in('matter_id', ids)
      .order('created_at', { ascending: false })
      .limit(50);
    
    docs = (data as any) ?? [];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Mes documents</h1>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {docs.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {docs.map(d => (
              <div key={d.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{d.title}</p>
                  <p className="text-xs text-slate-500">{d.matter?.title ?? ''}</p>
                </div>
                {d.file_url && (
                  <a 
                    href={d.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  >
                    Télécharger
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-slate-400">Aucun document</div>
        )}
      </div>
    </div>
  );
}
