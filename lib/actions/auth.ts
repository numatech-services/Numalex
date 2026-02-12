// ============================================================
// NumaLex — Server Actions : Authentification (CORRIGÉ)
//
// FIX C4 : Onboarding atomique via la fonction SQL
//          `onboard_phone_user()` au lieu de 2 INSERT séparés.
// ============================================================

'use server';

import { createClient } from '@/lib/supabase/server';
import {
  emailLoginSchema,
  phoneLoginSchema,
  otpVerifySchema,
  toE164,
  type EmailLoginValues,
  type PhoneLoginValues,
  type OtpVerifyValues,
} from '@/lib/validators/auth';

// ---- Type de retour unifié ----

interface AuthSuccess {
  success: true;
  message: string;
}

interface AuthError {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
}

export type AuthActionResult = AuthSuccess | AuthError;

// ---- Utilitaire : extraire les erreurs de champs Zod ----

function extractFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.join('.');
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

// ============================================================
// 1. CONNEXION EMAIL + MOT DE PASSE
// ============================================================

export async function signInWithEmail(
  formData: EmailLoginValues
): Promise<AuthActionResult> {
  const parsed = emailLoginSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Vérifiez les champs du formulaire.',
      fieldErrors: extractFieldErrors(parsed.error.issues),
    };
  }

  const { email, password } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const userMessage = mapSupabaseAuthError(error.message);
    return { success: false, error: userMessage };
  }

  return { success: true, message: 'Connexion réussie.' };
}

// ============================================================
// 2. DEMANDE D'OTP PAR TÉLÉPHONE
// ============================================================

export async function signInWithPhone(
  formData: PhoneLoginValues
): Promise<AuthActionResult> {
  const parsed = phoneLoginSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Numéro de téléphone invalide.',
      fieldErrors: extractFieldErrors(parsed.error.issues),
    };
  }

  const phoneE164 = toE164(parsed.data.phone);
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneE164,
  });

  if (error) {
    console.error('[signInWithPhone] OTP error:', error);

    if (error.message.includes('rate') || error.status === 429) {
      return {
        success: false,
        error: 'Trop de tentatives. Veuillez patienter quelques minutes.',
      };
    }

    return {
      success: false,
      error: 'Impossible d\'envoyer le code SMS. Vérifiez votre numéro.',
    };
  }

  return {
    success: true,
    message: `Code envoyé au ${formatPhoneDisplay(parsed.data.phone)}.`,
  };
}

// ============================================================
// 3. VÉRIFICATION DU CODE OTP + ONBOARDING ATOMIQUE
//
// FIX C4 : Utilise la fonction SQL `onboard_phone_user()`
//          qui crée cabinet + profil dans une seule transaction.
//          Idempotent : si le profil existe déjà, retourne
//          simplement le cabinet_id existant.
// ============================================================

export async function verifyPhoneOtp(
  formData: OtpVerifyValues
): Promise<AuthActionResult> {
  const parsed = otpVerifySchema.safeParse(formData);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Code de vérification invalide.',
      fieldErrors: extractFieldErrors(parsed.error.issues),
    };
  }

  const phoneE164 = toE164(parsed.data.phone);
  const supabase = createClient();

  // ── Vérification OTP ──
  const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
    phone: phoneE164,
    token: parsed.data.token,
    type: 'sms',
  });

  if (verifyError || !authData.user) {
    console.error('[verifyPhoneOtp] Verify error:', verifyError);

    if (verifyError?.message.includes('expired')) {
      return {
        success: false,
        error: 'Code expiré. Demandez un nouveau code.',
      };
    }

    return {
      success: false,
      error: 'Code invalide. Vérifiez et réessayez.',
    };
  }

  // ── FIX C4 : Onboarding atomique via fonction SQL ──
  const { error: onboardError } = await supabase.rpc('onboard_phone_user', {
    p_user_id: authData.user.id,
    p_phone: phoneE164,
  });

  if (onboardError) {
    console.error('[verifyPhoneOtp] Onboard error:', onboardError);
    // Ne pas bloquer la connexion — l'onboarding sera rattrapé
  }

  return { success: true, message: 'Vérification réussie. Bienvenue !' };
}

// ============================================================
// Utilitaires internes
// ============================================================

function mapSupabaseAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Votre email n\'a pas encore été confirmé. Vérifiez votre boîte de réception.';
  }
  if (lower.includes('too many requests') || lower.includes('rate')) {
    return 'Trop de tentatives. Veuillez patienter quelques minutes.';
  }
  if (lower.includes('user not found')) {
    return 'Aucun compte associé à cet email.';
  }
  if (lower.includes('signups not allowed')) {
    return 'Les inscriptions sont désactivées. Contactez l\'administrateur.';
  }

  return 'Erreur de connexion. Veuillez réessayer.';
}

function formatPhoneDisplay(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 8) {
    return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)}`;
  }
  return phone;
}
