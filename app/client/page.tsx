import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Espace Client — NumaLex' };

export default async function ClientDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Correction : Typage explicite ': { data: any }' pour débloquer le build
  const { data: access }: { data: any } = await supabase
    .from('client_portal_access')
    .select('client_id')
    .eq('auth_user_id', user.id)
    .eq('active', true)
    .single();

  if (!access) redirect('/login');

  const [{ count: matterCount }, { count: invCount }] = await Promise.all([
    supabase.from('matters').select('id', { count: 'exact', head: true }).eq('client_id', access.client_id),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('client_id', access.client_id),
  ]);

  const cards = [
    { label: 'Mes dossiers', value: matterCount ?? 0, href: '/client/dossiers', icon: '📂', color: 'border-blue-500' },
    { label: 'Mes documents', value: '—', href: '/client/documents', icon: '📄', color: 'border-emerald-500' },
    { label: 'Mes factures', value: invCount ?? 0, href: '/client/factures', icon: '🧾', color: 'border-amber-500' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Bienvenue dans votre espace client</h1>
      <p className="mt-1 text-sm text-slate-500">Consultez vos dossiers, documents et factures en toute sécurité.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className={`group rounded-2xl border-l-4 ${card.color} border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md`}>
            <span className="text-3xl">{card.icon}</span>
            <p className="mt-3 text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500 group-hover:text-slate-700">{card.label} →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
