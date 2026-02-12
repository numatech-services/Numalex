// ============================================================
// NumaLex — Formulaire Profil (Client Component)
// ============================================================

'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

interface ProfileFormProps {
  profileId: string;
  defaultName: string;
  defaultPhone: string;
}

export function ProfileForm({ profileId, defaultName, defaultPhone }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim() || null, phone: phone.trim() || null })
        .eq('id', profileId);

      if (error) {
        toast('error', `Erreur : ${error.message}`);
      } else {
        toast('success', 'Profil mis à jour.');
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="prof-name" className="block text-sm font-medium text-slate-700">Nom complet</label>
        <input
          id="prof-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Maître Abdoulaye Diallo"
          disabled={isPending}
          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="prof-phone" className="block text-sm font-medium text-slate-700">Téléphone</label>
        <input
          id="prof-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+227 90 12 34 56"
          disabled={isPending}
          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="relative h-9 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-60"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Enregistrement…
            </span>
          ) : (
            'Enregistrer'
          )}
        </button>
      </div>
    </form>
  );
}
