import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';
import { InvoiceForm } from '@/components/invoices/invoice-form';

export const metadata = { title: 'Nouvelle facture' };

export default async function NewInvoicePage() {
  let profile;
  try { profile = await fetchCurrentProfile(); } catch { redirect('/login'); }

  const supabase = createClient();
  const [{ data: clients }, { data: matters }] = await Promise.all([
    supabase.from('clients').select('id, full_name').order('full_name'),
    supabase.from('matters').select('id, title').order('title'),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/factures" className="hover:text-slate-900">Factures</Link>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300"><path d="M6 4l4 4-4 4" /></svg>
        <span className="text-slate-900">Nouvelle</span>
      </nav>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">Nouvelle facture</h1>
        <p className="mt-1 text-sm text-slate-500">TVA Niger : 19% — Montants en FCFA</p>
        <div className="mt-6"><InvoiceForm clients={clients ?? []} matters={matters ?? []} /></div>
      </div>
    </div>
  );
}
