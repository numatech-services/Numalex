// ============================================================
// NumaLex — Auth Callback Route (sécurisé)
//
// Sécurité :
// - Validation paramètres avec Zod
// - Vérification origine (même domaine)
// - Journalisation des échecs
// - Redirect sanitisé (pas d'open redirect)
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

// Schéma de validation des paramètres callback
const callbackSchema = z.object({
  code: z.string().min(10, 'Code invalide').max(500),
  next: z.string().regex(/^\/[a-zA-Z0-9\-\/]*$/, 'Redirect invalide').default('/dashboard'),
});

// Chemins de redirect autorisés (whitelist)
const ALLOWED_REDIRECTS = ['/dashboard', '/client', '/dashboard/dossiers'];

function sanitizeRedirect(next: string): string {
  // Empêcher open redirect — n'autoriser que les chemins internes
  if (ALLOWED_REDIRECTS.some((p) => next.startsWith(p))) return next;
  return '/dashboard';
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // 1. Valider les paramètres
  const parsed = callbackSchema.safeParse({
    code: searchParams.get('code'),
    next: searchParams.get('next') ?? '/dashboard',
  });

  if (!parsed.success) {
    console.error(JSON.stringify({
      type: 'AUTH_CALLBACK_INVALID',
      ip,
      errors: parsed.error.flatten(),
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.redirect(`${origin}/login?error=invalid_callback`);
  }

  const { code, next } = parsed.data;
  const safeNext = sanitizeRedirect(next);

  // 2. Échanger le code contre une session
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach((cookie: any) => {
              const { name, value, options } = cookie;
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
              });
            });
          } catch { /* Middleware handles this */ }
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(JSON.stringify({
      type: 'AUTH_CALLBACK_FAIL',
      ip,
      error: error.message,
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // 3. Succès — log et redirect sécurisé
  console.log(JSON.stringify({
    type: 'AUTH_CALLBACK_SUCCESS',
    ip,
    redirect: safeNext,
    timestamp: new Date().toISOString(),
  }));

  return NextResponse.redirect(`${origin}${safeNext}`);
}
