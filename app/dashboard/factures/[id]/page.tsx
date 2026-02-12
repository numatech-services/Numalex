import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';
import { InvoiceForm } from '@/components/invoices/invoice-form';

export const metadata = { title: 'Modifier facture' };

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  let profile;
  try { 
    profile = await fetchCurrentProfile(); 
  } catch { 
    redirect('/login'); 
  }

  const supabase = createClient();

  // Correction : On sépare les réponses pour forcer le typage
  const [invoiceRes, clientsRes, mattersRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, invoice_number, amount_ht, tva_rate, status, client_id, matter_id, issued_at, due_at, paid_at, notes')
      .eq('id', params.id)
      .eq('cabinet_id', profile.cabinet_id)
      .single(),
    supabase.from('clients').select('id, full_name').order('full_name'),
    supabase.from('matters').select('id, title').order('title'),
  ]);

  const invoice = invoiceRes.data as any; // Forçage du type pour éviter 'never'
  const clients = clientsRes.data ?? [];
  const matters = mattersRes.data ?? [];

  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/factures" className="hover:text-slate-900">Factures</Link>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
          <path d="M6 4l4 4-4 4" />
        </svg>
        <span className="truncate text-slate-900">{invoice.invoice_number}</span>
      </nav>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">Modifier la facture</h1>
        <div className="mt-6">
          <InvoiceForm 
            initialData={invoice} 
            clients={clients} 
            matters={matters} 
          />
        </div>
      </div>
    </div>
  );
}
