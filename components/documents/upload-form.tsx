'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useRef, useId } from 'react';
import { uploadDocument } from '@/lib/actions/documents';
import { useToast } from '@/components/ui/toast';

const DOC_TYPES = [
  { value: 'assignation', label: 'Assignation' },
  { value: 'conclusions', label: 'Conclusions' },
  { value: 'jugement', label: 'Jugement' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'proces_verbal', label: 'Procès-verbal' },
  { value: 'facture', label: 'Facture' },
  { value: 'correspondance', label: 'Correspondance' },
  { value: 'autre', label: 'Autre' },
];

interface UploadFormProps {
  matters: { id: string; title: string }[];
}

export function UploadForm({ matters }: UploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fid = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFileChange(file: File | null) {
    setFileName(file?.name ?? null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await uploadDocument(formData);
      if (result.success) {
        toast('success', 'Document téléversé.');
        router.push('/dashboard/documents');
        router.refresh();
      } else {
        toast('error', result.error);
      }
    });
  }

  const busy = isPending;
  const cls = 'block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Zone de drop */}
      <div
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver ? 'border-slate-400 bg-slate-50' : 'border-slate-200 bg-white'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file && fileRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileRef.current.files = dt.files;
            handleFileChange(file);
          }
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 text-slate-300">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
        </svg>
        {fileName ? (
          <p className="text-sm font-medium text-slate-900">{fileName}</p>
        ) : (
          <>
            <p className="text-sm text-slate-600">Glissez un fichier ici ou</p>
            <button type="button" onClick={() => fileRef.current?.click()} className="mt-1 text-sm font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700">parcourez vos fichiers</button>
          </>
        )}
        <p className="mt-2 text-xs text-slate-400">PDF, Word, image… (max 10 Mo)</p>
        <input
          ref={fileRef}
          type="file"
          name="file"
          className="sr-only"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${fid}-t`} className="block text-sm font-medium text-slate-700">Titre <span className="text-red-500">*</span></label>
        <input id={`${fid}-t`} name="title" type="text" placeholder="Ex : Assignation — Affaire ABC" disabled={busy} className={cls} required />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-dt`} className="block text-sm font-medium text-slate-700">Type de document</label>
          <select id={`${fid}-dt`} name="doc_type" disabled={busy} className={cls}>
            {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fid}-m`} className="block text-sm font-medium text-slate-700">Dossier lié</label>
          <select id={`${fid}-m`} name="matter_id" disabled={busy} className={cls}>
            <option value="">— Aucun —</option>
            {matters.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
        <button type="button" onClick={() => router.back()} disabled={busy} className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
        <button type="submit" disabled={busy || !fileName} className="relative h-10 rounded-lg bg-slate-900 px-6 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60">
          {busy && <span className="absolute inset-0 flex items-center justify-center"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /></span>}
          <span className={busy ? 'invisible' : ''}>Téléverser</span>
        </button>
      </div>
    </form>
  );
}
