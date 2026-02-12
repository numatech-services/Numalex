import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';
import { EventForm } from '@/components/agenda/event-form';

export const metadata = { title: 'Modifier événement' };

export default async function EditEventPage({ params }: { params: { id: string } }) {
  let profile;
  try { profile = await fetchCurrentProfile(); } catch { redirect('/login'); }

  const supabase = createClient();

  const [{ data: event }, { data: matters }] = await Promise.all([
    supabase.from('events').select('id, title, event_type, starts_at, ends_at, location, description, matter_id').eq('id', params.id).eq('cabinet_id', profile.cabinet_id).single(),
    supabase.from('matters').select('id, title').order('title'),
  ]);

  if (!event) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/agenda" className="hover:text-slate-900">Agenda</Link>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300"><path d="M6 4l4 4-4 4" /></svg>
        <span className="truncate text-slate-900">{event.title}</span>
      </nav>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">Modifier l'événement</h1>
        <div className="mt-6"><EventForm initialData={event ?? undefined} matters={matters ?? []} /></div>
      </div>
    </div>
  );
}
