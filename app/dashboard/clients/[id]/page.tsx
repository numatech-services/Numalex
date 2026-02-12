// ============================================================
// NumaLex — Page : Modifier Client
// Route : /dashboard/clients/[id]
// ============================================================

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';
import { ClientForm } from '@/components/clients/client-form';
import { DeleteClientButton } from '@/components/clients/delete-client-button';

export const metadata = { title: 'Modifier client' };

export default async function EditClientPage({ params }: { params: { id: string } }) {
  let profile;
  try {
    profile = await fetchCurrentProfile();
  } catch {
    redirect('/login');
  }

  const supabase = createClient();
  const { data: client, error } = await supabase
    .from('clients')
    .select('id, full_name, client_type, phone, email, address, notes')
    .eq('id', params.id)
    .eq('cabinet_id', profile.cabinet_id)
    .single();

  if (error || !client) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/clients" className="transition-colors hover:text-slate-900">Clients</Link>
        <ChevronRight />
        <span className="truncate text-slate-900">{client.full_name}</span>
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Modifier le client</h1>
          <DeleteClientButton clientId={client.id} clientName={client.full_name} />
        </div>
        <div className="mt-6">
          <ClientForm initialData={client ?? undefined} />
        </div>
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}
