// ============================================================
// NumaLex — Schémas de validation Zod
// Validation centralisée pour TOUTES les Server Actions.
// ============================================================

import { z } from 'zod';

// ─── Helpers ───

const uuidSchema = z.string().uuid('ID invalide');
const phoneSchema = z.string().regex(/^(\+227|00227)?[0-9]{8}$/, 'Numéro de téléphone nigérien invalide (8 chiffres)').optional().or(z.literal(''));
const emailSchema = z.string().email('Email invalide').optional().or(z.literal(''));
const positiveNumber = z.coerce.number().positive('Doit être positif');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Format de date invalide (YYYY-MM-DD)');

// ─── CLIENT ───

export const clientSchema = z.object({
  full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(200),
  client_type: z.enum(['physique', 'morale'], { message: 'Type de client invalide' }),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().max(500).optional(),
  company_name: z.string().max(200).optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;

// ─── MATTER ───

export const matterSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(300),
  reference: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['ouvert', 'en_cours', 'suspendu', 'clos', 'archive', 'brouillon', 'termine']).optional(),
  client_id: uuidSchema.optional().or(z.literal('')),
  juridiction: z.string().max(200).optional(),
  court_number: z.string().max(100).optional(),
  matter_type: z.string().max(100).optional(),
  assigned_to: uuidSchema.optional().or(z.literal('')),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export type MatterInput = z.infer<typeof matterSchema>;

// ─── EVENT ───

export const eventSchema = z.object({
  title: z.string().min(2, 'Le titre est obligatoire').max(300),
  event_type: z.enum(['audience', 'rdv', 'deadline', 'autre', 'acte', 'signification', 'constat', 'paiement', 'depot', 'jugement', 'appel', 'saisie', 'expulsion']),
  starts_at: z.string().min(1, "La date de début est obligatoire"),
  ends_at: z.string().optional(),
  location: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  matter_id: uuidSchema.optional().or(z.literal('')),
});

export type EventInput = z.infer<typeof eventSchema>;

// ─── INVOICE ───

export const invoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Le numéro est obligatoire').max(50),
  client_id: uuidSchema.optional().or(z.literal('')),
  matter_id: uuidSchema.optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
  objet: z.string().max(500).optional(),
  amount_ht: positiveNumber,
  tva_rate: z.coerce.number().min(0).max(100).default(19),
  total_ttc: positiveNumber,
  status: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard', 'annulee']).optional(),
  due_at: z.string().optional(),
  devise: z.string().default('XOF'),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

// ─── DOCUMENT (metadata, not file) ───

export const documentMetaSchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire').max(300),
  doc_type: z.enum(['assignation', 'conclusions', 'jugement', 'contrat', 'proces_verbal', 'facture', 'correspondance', 'autre']),
  matter_id: uuidSchema.optional().or(z.literal('')),
});

// ─── TIME ENTRY (Avocat) ───

export const timeEntrySchema = z.object({
  matter_id: uuidSchema,
  minutes: z.coerce.number().int().min(1, 'Durée minimum 1 minute').max(1440, 'Maximum 24h'),
  description: z.string().min(3, 'Description obligatoire').max(2000),
  entry_date: dateSchema,
  hourly_rate: z.coerce.number().min(0).optional(),
  billable: z.boolean().default(true),
});

export type TimeEntryInput = z.infer<typeof timeEntrySchema>;

// ─── NOTARY ACT (Notaire) ───

export const notaryActSchema = z.object({
  title: z.string().min(3, 'Intitulé obligatoire').max(500),
  act_type: z.enum(['vente_immobiliere', 'donation', 'testament', 'constitution_societe', 'bail', 'procuration', 'certificat_heritage', 'acte_notoriete', 'autre']),
  act_number: z.string().max(50).optional(),
  matter_id: uuidSchema.optional().or(z.literal('')),
  client_id: uuidSchema.optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  act_date: z.string().optional(),
  notary_fees: z.coerce.number().min(0).optional(),
  tax_amount: z.coerce.number().min(0).optional(),
  signed: z.boolean().default(false),
});

export type NotaryActInput = z.infer<typeof notaryActSchema>;

// ─── BAILIFF REPORT (Huissier) ───

export const bailiffReportSchema = z.object({
  title: z.string().min(3, 'Intitulé obligatoire').max(500),
  report_type: z.enum(['constat', 'signification', 'saisie', 'expulsion', 'inventaire', 'sommation', 'autre']),
  report_number: z.string().max(50).optional(),
  matter_id: uuidSchema.optional().or(z.literal('')),
  client_id: uuidSchema.optional().or(z.literal('')),
  location: z.string().max(500).optional(),
  gps_lat: z.coerce.number().min(-90).max(90).optional(),
  gps_lng: z.coerce.number().min(-180).max(180).optional(),
  description: z.string().max(10000).optional(),
  report_date: dateSchema.optional(),
  served: z.boolean().default(false),
  served_to: z.string().max(200).optional(),
  fees: z.coerce.number().min(0).optional(),
});

export type BailiffReportInput = z.infer<typeof bailiffReportSchema>;

// ─── PAYMENT ───

export const paymentSchema = z.object({
  facture_id: uuidSchema,
  montant: positiveNumber,
  mode: z.enum(['especes', 'virement', 'cheque', 'orange_money', 'airtel_money', 'wave', 'carte', 'autre']),
  reference: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

// ─── AI ───

export const aiRequestSchema = z.object({
  action: z.enum(['summarize', 'draft_letter', 'checklist', 'suggest_actions', 'custom']),
  matterId: uuidSchema.optional(),
  prompt: z.string().min(1).max(5000, 'Prompt trop long (max 5000 caractères)'),
});

// ─── AUTH ───

export const loginEmailSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court (8 caractères minimum)'),
});

export const loginOtpSchema = z.object({
  phone: z.string().regex(/^(\+227|00227)?[0-9]{8}$/, 'Numéro invalide'),
});

// ─── HELPER : Valider et retourner erreur standardisée ───

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}`.replace(/^: /, '') };
  }
  return { success: true, data: result.data };
}
