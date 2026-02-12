// ============================================================
// NumaLex — Schéma de validation Zod pour les dossiers
// Les champs conditionnels (juridiction, date_signification…)
// sont optionnels au niveau du schéma de base, et rendus
// obligatoires côté formulaire via le `superRefine` contextuel.
// ============================================================

import { z } from 'zod';

// ---- Valeurs des enums (réutilisables dans les selects) ----

export const MATTER_STATUSES = [
  'ouvert',
  'en_cours',
  'suspendu',
  'clos',
  'archive',
] as const;

export const JURIDICTIONS_NIGER = [
  'TI Niamey',
  'TGI Niamey',
  'TGI Zinder',
  'TGI Maradi',
  'TGI Tahoua',
  'TGI Agadez',
  'TGI Dosso',
  'TGI Diffa',
  'TGI Tillabéri',
  'Cour d\'appel de Niamey',
  'Cour de cassation',
  'CCJA (Abidjan)',
  'Tribunal de commerce',
  'Tribunal du travail',
  'Autre',
] as const;

// ---- Schéma de base ----

export const matterSchema = z.object({
  // Champ caché en mode édition — absent en mode création
  id: z.string().uuid().optional(),

  title: z
    .string({ required_error: 'Le titre est obligatoire' })
    .trim()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre ne doit pas dépasser 200 caractères'),

  client_id: z
    .string()
    .uuid('Sélectionnez un client valide')
    .optional()
    .or(z.literal('')),

  status: z.enum(MATTER_STATUSES, {
    required_error: 'Sélectionnez un statut',
  }),

  description: z
    .string()
    .max(5000, 'La description est trop longue')
    .optional()
    .or(z.literal('')),

  // ── Champs Avocat ──
  juridiction: z
    .string()
    .max(200)
    .optional()
    .or(z.literal('')),

  parties_adverses: z
    .string()
    .max(1000, 'Trop long (max 1000 caractères)')
    .optional()
    .or(z.literal('')),

  // ── Champ Huissier ──
  date_signification: z
    .string()
    .optional()
    .or(z.literal('')),
});

// ---- Type inféré ----

export type MatterFormValues = z.infer<typeof matterSchema>;

// ---- Schéma enrichi avec validation contextuelle par rôle ----

export function createMatterSchemaForRole(role: 'avocat' | 'huissier' | 'notaire') {
  return matterSchema.superRefine((data, ctx) => {
    if (role === 'avocat') {
      if (!data.juridiction || data.juridiction.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La juridiction est obligatoire pour un avocat',
          path: ['juridiction'],
        });
      }
    }

    if (role === 'huissier') {
      if (!data.date_signification || data.date_signification.trim() === '') {
        // Pas bloquant : la date peut être renseignée plus tard
        // Décommenter pour la rendre obligatoire :
        // ctx.addIssue({
        //   code: z.ZodIssueCode.custom,
        //   message: 'La date de signification est obligatoire',
        //   path: ['date_signification'],
        // });
      }
    }
  });
}
