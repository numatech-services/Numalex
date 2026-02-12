// ============================================================
// NumaLex — Schémas de validation Zod : Authentification
//
// Format téléphone Niger :
//   • 8 chiffres après l'indicatif +227
//   • Préfixes mobiles : 70, 73, 74, 75, 80, 81, 82, 83,
//     84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 96, 97
//   • Saisie utilisateur : "90123456" ou "90 12 34 56"
//   • Format E.164 final : "+22790123456"
// ============================================================

import { z } from 'zod';

// ---- Constantes ----

const NIGER_COUNTRY_CODE = '+227';
const NIGER_PHONE_DIGITS = 8;

/**
 * Regex : exactement 8 chiffres, commençant par un préfixe mobile nigérien.
 * Accepte les espaces et tirets dans la saisie (nettoyés avant validation).
 */
const NIGER_PHONE_REGEX = /^(70|73|74|75|80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|96|97)\d{6}$/;

// ============================================================
// 1. Schéma : Connexion par Email
// ============================================================

export const emailLoginSchema = z.object({
  email: z
    .string({ required_error: 'L\'adresse email est obligatoire' })
    .trim()
    .email('Format d\'email invalide')
    .max(254, 'Email trop long'),

  password: z
    .string({ required_error: 'Le mot de passe est obligatoire' })
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Mot de passe trop long'),
});

export type EmailLoginValues = z.infer<typeof emailLoginSchema>;

// ============================================================
// 2. Schéma : Demande d'OTP par téléphone
// ============================================================

export const phoneLoginSchema = z.object({
  phone: z
    .string({ required_error: 'Le numéro de téléphone est obligatoire' })
    .trim()
    .transform((val) => val.replace(/[\s\-().]/g, ''))  // Nettoyer espaces, tirets…
    .refine(
      (val) => val.length === NIGER_PHONE_DIGITS,
      { message: `Le numéro doit contenir exactement ${NIGER_PHONE_DIGITS} chiffres` }
    )
    .refine(
      (val) => NIGER_PHONE_REGEX.test(val),
      { message: 'Numéro invalide. Saisissez un numéro mobile nigérien (ex : 90 12 34 56)' }
    ),
});

export type PhoneLoginValues = z.infer<typeof phoneLoginSchema>;

// ============================================================
// 3. Schéma : Vérification du code OTP
// ============================================================

export const otpVerifySchema = z.object({
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/[\s\-().]/g, ''))
    .refine((val) => NIGER_PHONE_REGEX.test(val)),

  token: z
    .string({ required_error: 'Le code de vérification est obligatoire' })
    .trim()
    .regex(/^\d{6}$/, 'Le code doit contenir exactement 6 chiffres'),
});

export type OtpVerifyValues = z.infer<typeof otpVerifySchema>;

// ============================================================
// Utilitaire : formater en E.164
// ============================================================

export function toE164(localNumber: string): string {
  const cleaned = localNumber.replace(/[\s\-().]/g, '');
  return `${NIGER_COUNTRY_CODE}${cleaned}`;
}
