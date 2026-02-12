import { z } from 'zod';

export const INVOICE_STATUSES = ['brouillon', 'envoyee', 'payee', 'en_retard', 'annulee'] as const;

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyée',
  payee: 'Payée',
  en_retard: 'En retard',
  annulee: 'Annulée',
};

export const invoiceSchema = z.object({
  id: z.string().uuid().optional(),

  invoice_number: z
    .string({ required_error: 'Numéro obligatoire' })
    .trim()
    .min(1, 'Numéro obligatoire')
    .max(50),

  client_id: z.string().uuid('Client invalide').optional().or(z.literal('')),
  matter_id: z.string().uuid().optional().or(z.literal('')),

  amount_ht: z
    .number({ required_error: 'Montant obligatoire', invalid_type_error: 'Montant invalide' })
    .min(0, 'Le montant ne peut pas être négatif')
    .max(999999999, 'Montant trop élevé'),

  tva_rate: z
    .number()
    .min(0).max(100)
    .default(19),

  status: z.enum(INVOICE_STATUSES).default('brouillon'),

  issued_at: z.string().optional().or(z.literal('')),
  due_at: z.string().optional().or(z.literal('')),
  paid_at: z.string().optional().or(z.literal('')),

  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
