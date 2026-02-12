// ============================================================
// NumaLex — Schéma de validation Zod pour les Clients
// ============================================================

import { z } from 'zod';

export const CLIENT_TYPES = ['physique', 'morale'] as const;

export const clientSchema = z.object({
  id: z.string().uuid().optional(),

  full_name: z
    .string({ required_error: 'Le nom est obligatoire' })
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne doit pas dépasser 200 caractères'),

  client_type: z.enum(CLIENT_TYPES, {
    required_error: 'Sélectionnez un type de client',
  }),

  phone: z
    .string()
    .max(20)
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .email('Adresse email invalide')
    .optional()
    .or(z.literal('')),

  address: z
    .string()
    .max(500)
    .optional()
    .or(z.literal('')),

  notes: z
    .string()
    .max(2000, 'Notes trop longues (max 2000 caractères)')
    .optional()
    .or(z.literal('')),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
