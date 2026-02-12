import { z } from 'zod';

export const EVENT_TYPES = ['audience', 'rdv', 'deadline', 'autre'] as const;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  audience: 'Audience',
  rdv: 'Rendez-vous',
  deadline: 'Échéance',
  autre: 'Autre',
};

export const eventSchema = z.object({
  id: z.string().uuid().optional(),

  title: z
    .string({ required_error: 'Le titre est obligatoire' })
    .trim()
    .min(2, 'Minimum 2 caractères')
    .max(200, 'Maximum 200 caractères'),

  event_type: z.enum(EVENT_TYPES, { required_error: 'Sélectionnez un type' }),

  matter_id: z.string().uuid().optional().or(z.literal('')),

  starts_at: z
    .string({ required_error: 'Date/heure de début obligatoire' })
    .min(1, 'Date/heure de début obligatoire'),

  ends_at: z.string().optional().or(z.literal('')),

  location: z.string().max(300).optional().or(z.literal('')),

  description: z.string().max(2000).optional().or(z.literal('')),
});

export type EventFormValues = z.infer<typeof eventSchema>;
