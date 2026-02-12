// ============================================================
// NumaLex — Supabase Server Client (App Router)
//
// FIX C1 : Migration de @supabase/auth-helpers-nextjs (déprécié)
//          vers @supabase/ssr (officiel, supporté).
//
// Installation requise :
//   npm install @supabase/ssr @supabase/supabase-js
//   npm uninstall @supabase/auth-helpers-nextjs
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

/**
 * Crée un client Supabase côté serveur (Server Components + Server Actions).
 * Lit et écrit les cookies de session automatiquement.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll est appelé depuis un Server Component en lecture seule.
            // On ignore silencieusement — le middleware gère le rafraîchissement.
          }
        },
      },
    }
  );
}
