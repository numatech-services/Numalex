'use client';

import { useState, useTransition } from 'react';
import { addNote, deleteNote } from '@/lib/actions/notes';
import { useToast } from '@/components/ui/toast';

interface Note {
  id: string;
  contenu: string;
  created_at: string;
  auteur: { full_name: string } | null;
}

export function PrivateNotes({ dossierId, notes: initialNotes }: { dossierId: string; notes: Note[] }) {
  const [isPending, startTransition] = useTransition();
  const [contenu, setContenu] = useState('');
  const { toast } = useToast();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!contenu.trim()) return;
    startTransition(async () => {
      const r = await addNote({ dossier_id: dossierId, contenu });
      if (r.success) { setContenu(''); toast('success', 'Note ajoutée.'); }
      else toast('error', r.error ?? 'Erreur');
    });
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      const r = await deleteNote(noteId, dossierId);
      if (r.success) toast('success', 'Note supprimée.');
      else toast('error', r.error ?? 'Erreur');
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Notes privées <span className="text-xs font-normal text-slate-400">(visibles uniquement par vous)</span>
      </h3>

      <form onSubmit={handleAdd} className="mb-4">
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder="Ajouter une note privée…"
          rows={2}
          disabled={isPending}
          className="mb-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
        <button
          type="submit"
          disabled={isPending || !contenu.trim()}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? '…' : 'Ajouter'}
        </button>
      </form>

      {initialNotes.length > 0 ? (
        <div className="space-y-2">
          {initialNotes.map((note) => (
            <div key={note.id} className="group rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{note.contenu}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {note.auteur?.full_name ?? 'Moi'} — {new Date(note.created_at).toLocaleDateString('fr')}
                </span>
                <button
                  onClick={() => handleDelete(note.id)}
                  disabled={isPending}
                  className="text-[10px] text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-slate-400">Aucune note</p>
      )}
    </div>
  );
}
