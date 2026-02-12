import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ToastProvider } from '@/components/ui/toast';

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: access } = await supabase
    .from('client_portal_access')
    .select('id, client_id, cabinet_id, active')
    .eq('auth_user_id', user.id)
    .eq('active', true)
    .single();

  if (!access) redirect('/login');

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span className="text-sm font-bold text-slate-900">NumaLex <span className="font-normal text-slate-400">| Espace Client</span></span>
            </div>
            <nav className="flex items-center gap-1">
              {[
                { href: '/client', label: 'Accueil' },
                { href: '/client/dossiers', label: 'Mes dossiers' },
                { href: '/client/documents', label: 'Documents' },
                { href: '/client/factures', label: 'Factures' },
              ].map((link) => (
                <a key={link.href} href={link.href} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </ToastProvider>
  );
}
