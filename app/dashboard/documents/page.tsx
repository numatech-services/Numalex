import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';

export const metadata = { title: 'Documents' };

const DT: Record<string, string> = { assignation: 'Assignation', conclusions: 'Conclusions', jugement: 'Jugement', contrat: 'Contrat', proces_verbal: 'PV', facture: 'Facture', correspondance: 'Correspondance', autre: 'Autre' };

export default async function DocumentsPage() {
  let profile;
  try { profile = await fetchCurrentProfile(); } catch { redirect('/login'); }

  const supabase = createClient();
  
  // Correction : Ajout du typage explicite ': { data: any[] | null, count: number | null }'
  const { data: documents, count }: { data: any[] | null, count: number | null } = await supabase
    .from('documents')
    .select('id, title, doc_type, file_url, file_size, mime_type, created_at, matter:matters!documents_matter_id_fkey(id,title)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">{count ?? 0} document{(count ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/documents/nouveau" className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          Téléverser
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {documents && documents.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/60">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{doc.title}</p>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span>{DT[doc.doc_type] ?? doc.doc_type}</span>
                    {doc.file_size && <span>{fmtSize(doc.file_size)}</span>}
                    {doc.matter?.title && <span>Dossier : {doc.matter?.title}</span>}
                  </div>
                </div>
                <span className="hidden text-xs text-slate-400 sm:block">{fmtDate(doc.created_at)}</span>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    Ouvrir
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </div>
            <p className="font-medium text-slate-700">Aucun document</p>
            <Link href="/dashboard/documents/nouveau" className="mt-2 inline-flex h-9 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800">Téléverser un document</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function fmtSize(b: number) { return b < 1024 ? `${b} o` : b < 1048576 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1048576).toFixed(1)} Mo`; }
function fmtDate(d: string) { try { return new Intl.DateTimeFormat(['fr-NE', 'fr'], { day: '2-digit', month: 'short' }).format(new Date(d)); } catch { return ''; } }
