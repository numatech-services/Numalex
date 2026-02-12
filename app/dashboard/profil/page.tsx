// ============================================================
// NumaLex — Page : Profil & Réglages
// Route : /dashboard/profil
// ============================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCurrentProfile } from '@/lib/queries/matters';
import { ProfileForm } from '@/components/dashboard/profile-form';

export const metadata = { title: 'Profil' };

const ROLE_LABELS: Record<string, string> = {
  avocat: 'Avocat',
  huissier: 'Huissier',
  notaire: 'Notaire',
};

export default async function ProfilPage() {
  let profile;
  try {
    profile = await fetchCurrentProfile();
  } catch {
    redirect('/login');
  }

  const supabase = createClient();
  
  // Correction : Forçage du type ': { data: any }' pour éviter l'erreur 'never'
  const { data: cabinet }: { data: any } = await supabase
    .from('cabinets')
    .select('id, name, nif, address, phone')
    .eq('id', profile.cabinet_id)
    .single();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profil & Réglages</h1>
      <p className="mt-1 text-sm text-slate-500">Gérez vos informations personnelles et celles de votre cabinet.</p>

      {/* Section profil */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-base font-semibold text-slate-900">Informations personnelles</h2>
        <p className="mt-1 text-sm text-slate-500">
          Rôle : <span className="font-medium text-slate-700">{ROLE_LABELS[profile.role]}</span>
        </p>
        <div className="mt-6">
          <ProfileForm
            profileId={profile.id}
            defaultName={profile.full_name ?? ''}
            defaultPhone={profile.phone ?? ''}
          />
        </div>
      </div>

      {/* Section cabinet */}
      {cabinet && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-base font-semibold text-slate-900">Cabinet</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">Nom</dt>
              <dd className="mt-1 text-sm text-slate-900">{cabinet.name}</dd>
            </div>
            {cabinet.nif && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">NIF</dt>
                <dd className="mt-1 font-mono text-sm text-slate-900">{cabinet.nif}</dd>
              </div>
            )}
            {cabinet.phone && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">Téléphone</dt>
                <dd className="mt-1 text-sm text-slate-900">{cabinet.phone}</dd>
              </div>
            )}
            {cabinet.address && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">Adresse</dt>
                <dd className="mt-1 text-sm text-slate-900">{cabinet.address}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
