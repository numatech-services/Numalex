// ============================================================
// NumaLex — Bouton Supprimer un dossier (Client Component)
// Affiche une modale de confirmation avant suppression.
// ============================================================

'use client';

import { useState, useTransition } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { deleteMatter } from '@/lib/actions/matters';
import { useToast } from '@/components/ui/toast';

export function DeleteMatterButton({ matterId, matterTitle }: { matterId: string; matterTitle: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await deleteMatter(matterId);
        // redirect() dans l'action gère la navigation
      } catch (err: unknown) {
        // NEXT_REDIRECT est attendu et sera intercepté par Next.js
        if (err?.digest?.includes('NEXT_REDIRECT')) return;
        toast('error', err.message ?? 'Erreur lors de la suppression.');
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:border-red-300"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
        Supprimer
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        loading={isPending}
        title="Supprimer ce dossier ?"
        description={`Le dossier « ${matterTitle} » sera définitivement supprimé, ainsi que toutes les données associées. Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        confirmVariant="danger"
      />
    </>
  );
}
