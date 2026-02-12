#!/usr/bin/env node
// ============================================================
// NumaLex — Script de création des utilisateurs de test
//
// Usage :
//   node scripts/seed-users.mjs
//
// Prérequis :
//   - .env.local avec NEXT_PUBLIC_SUPABASE_URL
//   - .env.local avec SUPABASE_SERVICE_ROLE_KEY
//   - Avoir exécuté seed_test_data.sql AVANT (pour les cabinets)
//
// ⚠️  NE JAMAIS EXÉCUTER EN PRODUCTION
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Charger .env.local
try {
  const envFile = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
} catch { /* ignore */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variables manquantes :');
  console.error('   NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  console.error('   doivent être définis dans .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Utilisateurs à créer ───

const USERS = [
  {
    email: 'admin@numalex.ne',
    password: 'NumaLex2026!',
    cabinet: 'cab-avocat-0001-0001-000000000001',
    role: 'avocat',
    rbac: 'admin',
    name: 'Me Ibrahima DIALLO',
    first: 'Ibrahima',
    last: 'DIALLO',
    phone: '+22790100001',
  },
  {
    email: 'avocat@numalex.ne',
    password: 'Avocat2026!',
    cabinet: 'cab-avocat-0001-0001-000000000001',
    role: 'avocat',
    rbac: 'associe',
    name: 'Me Aïssa MAHAMADOU',
    first: 'Aïssa',
    last: 'MAHAMADOU',
    phone: '+22790100002',
  },
  {
    email: 'collab@numalex.ne',
    password: 'Collab2026!',
    cabinet: 'cab-avocat-0001-0001-000000000001',
    role: 'avocat',
    rbac: 'collaborateur',
    name: 'Me Boubacar SEYNI',
    first: 'Boubacar',
    last: 'SEYNI',
    phone: '+22790100003',
  },
  {
    email: 'secr@numalex.ne',
    password: 'Secret2026!',
    cabinet: 'cab-avocat-0001-0001-000000000001',
    role: 'avocat',
    rbac: 'secretariat',
    name: 'Mme Fatima ADAM',
    first: 'Fatima',
    last: 'ADAM',
    phone: '+22790100004',
  },
  {
    email: 'notaire@numalex.ne',
    password: 'Notaire2026!',
    cabinet: 'cab-notaire-0001-0001-000000000002',
    role: 'notaire',
    rbac: 'admin',
    name: 'Me Hamidou GARBA',
    first: 'Hamidou',
    last: 'GARBA',
    phone: '+22790200001',
  },
  {
    email: 'huissier@numalex.ne',
    password: 'Huissier2026!',
    cabinet: 'cab-huissier-001-0001-000000000003',
    role: 'huissier',
    rbac: 'admin',
    name: 'Me Salissou IDRISSA',
    first: 'Salissou',
    last: 'IDRISSA',
    phone: '+22790300001',
  },
  {
    email: 'client@test.ne',
    password: 'Client2026!',
    cabinet: null, // Portail client, pas de cabinet direct
    role: null,
    rbac: 'client_portal',
    name: 'Amadou OUMAROU (Portail)',
    first: 'Amadou',
    last: 'OUMAROU',
    phone: '+22796000001',
  },
];

// ─── Exécution ───

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║  NumaLex — Création des utilisateurs de test         ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');

let created = 0;
let errors = 0;

for (const u of USERS) {
  // Vérifier si l'utilisateur existe déjà
  const { data: existing } = await supabase.auth.admin.listUsers();
  const alreadyExists = existing?.users?.find(usr => usr.email === u.email);

  if (alreadyExists) {
    console.log(`  ⏭️  ${u.email} existe déjà (${alreadyExists.id})`);
    continue;
  }

  // Créer dans Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  });

  if (error) {
    console.error(`  ❌ ${u.email}: ${error.message}`);
    errors++;
    continue;
  }

  const userId = data.user.id;

  // Créer le profil (sauf portail client)
  if (u.cabinet) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      cabinet_id: u.cabinet,
      role: u.role,
      rbac_role: u.rbac,
      full_name: u.name,
      phone: u.phone,
      active: true,
      first_name: u.first,
      last_name: u.last,
    });

    if (profileError) {
      console.error(`  ⚠️  Profil ${u.email}: ${profileError.message}`);
    }
  }

  // Si portail client, créer l'accès
  if (u.rbac === 'client_portal') {
    const { error: portalError } = await supabase.from('client_portal_access').insert({
      cabinet_id: 'cab-avocat-0001-0001-000000000001',
      client_id: 'cli-00000001-0001-0001-000000000001', // Amadou OUMAROU
      auth_user_id: userId,
      active: true,
    });

    if (portalError) {
      console.error(`  ⚠️  Portail client ${u.email}: ${portalError.message}`);
    }
  }

  console.log(`  ✅ ${u.email} → ${userId} (${u.rbac})`);
  created++;
}

console.log('');
console.log(`═══ Résultat : ${created} créés, ${errors} erreurs ═══`);
console.log('');

if (created > 0) {
  console.log('┌──────────────────────────────────────────────────────┐');
  console.log('│  COMPTES DE CONNEXION                                │');
  console.log('├──────────────────────┬───────────────┬───────────────┤');
  console.log('│ Email                │ Mot de passe  │ Rôle          │');
  console.log('├──────────────────────┼───────────────┼───────────────┤');
  for (const u of USERS) {
    const email = u.email.padEnd(20);
    const pwd = u.password.padEnd(13);
    const role = (u.rbac || '').padEnd(13);
    console.log(`│ ${email} │ ${pwd} │ ${role} │`);
  }
  console.log('└──────────────────────┴───────────────┴───────────────┘');
}
