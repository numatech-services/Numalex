import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';
import { AIAssistant } from '@/components/dashboard/ai-assistant';

export const metadata = { title: 'Assistant IA' };

export default async function AIPage() {
  let profile;
  try { profile = await fetchCurrentProfile(); } catch { redirect('/login'); }

  const supabase = createClient();
  const { data: matters } = await supabase.from('matters').select('id, title').order('title');

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <AIAssistant matters={matters ?? []} />
    </div>
  );
}
