import Link from 'next/link';

const ICON_BY_TYPE: Record<string, string> = {
  assignation: '📋', conclusions: '📝', jugement: '⚖️', contrat: '📄',
  proces_verbal: '📑', facture: '🧾', correspondance: '✉️', autre: '📎',
};

interface Document {
  id: string;
  title: string;
  doc_type: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
  matter: { id: string; title: string } | null;
}

export function OpenDocuments({ documents }: { documents: Document[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Documents récents</h2>
        <Link href="/dashboard/documents" className="text-xs font-medium text-blue-600 hover:text-blue-800">Voir tout →</Link>
      </div>
      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50">
              <span className="text-lg">{ICON_BY_TYPE[doc.doc_type] ?? '📎'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{doc.title}</p>
                <p className="text-[10px] text-slate-400">
                  {doc.matter?.title ?? 'Sans dossier'}
                  {doc.file_size ? ` • ${fmtSize(doc.file_size)}` : ''}
                </p>
              </div>
              {doc.file_url && (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-200">
                  Ouvrir
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-slate-400">Aucun document</p>
      )}
    </div>
  );
}

function fmtSize(b: number) { return b < 1024 ? `${b} o` : b < 1048576 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1048576).toFixed(1)} Mo`; }
