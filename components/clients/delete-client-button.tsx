'use client';

import { useState, useTransition } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { deleteClient } from '@/lib/actions/clients';
import { useToast } from '@/components/ui/toast';

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await deleteClient(clientId);
      } catch (err: any) {
        // Correction : On vérifie si c'est une redirection Next.js (comportement normal)
        if (err?.digest?.includes('NEXT_REDIRECT')) return;
        
        // Sinon, on affiche l'erreur réelle
        toast('error', err instanceof Error ? err.message : 'Erreur lors de la suppression.');
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        Supprimer
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        loading={isPending}
        title="Supprimer ce client ?"
        description={`Le client « ${clientName} » sera définitivement supprimé. Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        confirmVariant="danger"
      />
    </>
  );
}
