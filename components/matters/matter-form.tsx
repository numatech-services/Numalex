// ============================================================
// NumaLex — Formulaire de Dossier (Client Component)
//
// Adapte dynamiquement les champs selon le rôle :
//   • avocat   → Juridiction + Parties adverses
//   • huissier → Date de signification
//   • notaire  → Champs communs uniquement
//
// Utilise React Hook Form + Zod Resolver.
// Appelle la Server Action `upsertMatter`.
// ============================================================

'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Matter, UserRole, Client } from '@/types';
import {
  createMatterSchemaForRole,
  MATTER_STATUSES,
  JURIDICTIONS_NIGER,
  type MatterFormValues,
} from '@/lib/validators/matter';
import { upsertMatter, type UpsertMatterResult } from '@/lib/actions/matters';

// ---- Props ----

interface MatterFormProps {
  role: UserRole;
  clients: Pick<Client, 'id' | 'full_name'>[];
  initialData?: Matter;     // Présent en mode édition
}

// ---- Labels pour les statuts ----

const STATUS_LABELS: Record<string, string> = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  suspendu: 'Suspendu',
  clos: 'Clos',
  archive: 'Archivé',
};

// ============================================================
// Composant principal
// ============================================================

export function MatterForm({ role, clients, initialData }: MatterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formId = useId();
  const [serverMessage, setServerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const isEditing = Boolean(initialData?.id);

  // ── React Hook Form avec Zod résolution contextuelle ──

  const schema = createMatterSchemaForRole(role);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MatterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: initialData?.id ?? undefined,
      title: initialData?.title ?? '',
      client_id: initialData?.client_id ?? '',
      status: initialData?.status ?? 'ouvert',
      description: initialData?.description ?? '',
      juridiction: initialData?.juridiction ?? '',
      parties_adverses: initialData?.parties_adverses ?? '',
      date_signification: initialData?.date_signification ?? '',
    },
  });

  const busy = isSubmitting || isPending;

  // ── Soumission ──

  async function onSubmit(data: MatterFormValues) {
    setServerMessage(null);

    startTransition(async () => {
      const result: UpsertMatterResult = await upsertMatter(data);

      if (result.success) {
        setServerMessage({
          type: 'success',
          text: isEditing
            ? 'Dossier mis à jour avec succès.'
            : 'Dossier créé avec succès.',
        });

        // Redirection après un bref délai pour montrer le feedback
        setTimeout(() => {
          router.push(`/dashboard/dossiers/${result.matterId}`);
        }, 600);
      } else {
        setServerMessage({ type: 'error', text: result.error });

        // Injecter les erreurs serveur dans les champs
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            console.warn(`[MatterForm] Server field error [${field}]:`, messages);
          });
        }
      }
    });
  }

  // ============================================================
  // Rendu
  // ============================================================

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
      noValidate
    >
      {/* ── Message serveur (toast inline) ── */}
      {serverMessage && (
        <div
          role="alert"
          className={`rounded-lg border px-4 py-3 text-sm ${
            serverMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {serverMessage.text}
        </div>
      )}

      {/* ── ID caché en mode édition ── */}
      {initialData?.id && (
        <input type="hidden" {...register('id')} />
      )}

      {/* ============================================ */}
      {/* SECTION 1 : Informations générales          */}
      {/* ============================================ */}
      <fieldset className="space-y-5">
        <legend className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Informations générales
        </legend>

        {/* Titre */}
        <Field label="Titre du dossier" error={errors.title?.message} required fieldId={`${formId}-title`}>
          <input
            id={`${formId}-title`}
            type="text"
            placeholder="Ex : Affaire Société ABC c/ M. Diallo"
            aria-describedby={errors.title ? `${formId}-title-error` : undefined}
            {...register('title')}
            disabled={busy}
            className={inputClasses(errors.title)}
          />
        </Field>

        {/* Client + Statut (2 colonnes) */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Client */}
          <Field label="Client" error={errors.client_id?.message} fieldId={`${formId}-client`}>
            <select
              id={`${formId}-client`}
              {...register('client_id')}
              disabled={busy}
              className={inputClasses(errors.client_id)}
            >
              <option value="">— Aucun client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </Field>

          {/* Statut */}
          <Field label="Statut" error={errors.status?.message} required fieldId={`${formId}-status`}>
            <select
              id={`${formId}-status`}
              {...register('status')}
              disabled={busy}
              className={inputClasses(errors.status)}
            >
              {MATTER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] ?? s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Description */}
        <Field label="Description" error={errors.description?.message} fieldId={`${formId}-desc`}>
          <textarea
            id={`${formId}-desc`}
            rows={4}
            placeholder="Résumé des faits, contexte juridique…"
            {...register('description')}
            disabled={busy}
            className={inputClasses(errors.description)}
          />
        </Field>
      </fieldset>

      {/* ============================================ */}
      {/* SECTION 2 : Champs spécifiques au rôle      */}
      {/* ============================================ */}

      {/* ── Avocat : Juridiction + Parties adverses ── */}
      {role === 'avocat' && (
        <fieldset className="space-y-5 rounded-lg border border-blue-100 bg-blue-50/30 p-5">
          <legend className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            ⚖️ Champs Avocat
          </legend>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Juridiction"
              error={errors.juridiction?.message}
              required
              fieldId={`${formId}-juridiction`}
            >
              <select
                id={`${formId}-juridiction`}
                {...register('juridiction')}
                disabled={busy}
                className={inputClasses(errors.juridiction)}
              >
                <option value="">— Sélectionner —</option>
                {JURIDICTIONS_NIGER.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Parties adverses"
              error={errors.parties_adverses?.message}
              fieldId={`${formId}-parties`}
            >
              <input
                id={`${formId}-parties`}
                type="text"
                placeholder="Ex : Me Boubacar, Société XYZ"
                {...register('parties_adverses')}
                disabled={busy}
                className={inputClasses(errors.parties_adverses)}
              />
            </Field>
          </div>
        </fieldset>
      )}

      {/* ── Huissier : Date de signification ── */}
      {role === 'huissier' && (
        <fieldset className="space-y-5 rounded-lg border border-amber-100 bg-amber-50/30 p-5">
          <legend className="text-sm font-semibold uppercase tracking-wider text-amber-600">
            📋 Champs Huissier
          </legend>

          <Field
            label="Date de signification"
            error={errors.date_signification?.message}
            fieldId={`${formId}-signif`}
          >
            <input
              id={`${formId}-signif`}
              type="date"
              {...register('date_signification')}
              disabled={busy}
              className={inputClasses(errors.date_signification)}
            />
          </Field>
        </fieldset>
      )}

      {/* ============================================ */}
      {/* ACTIONS                                      */}
      {/* ============================================ */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={busy}
          className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={busy}
          className="relative h-10 rounded-lg bg-slate-900 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </span>
          )}
          <span className={busy ? 'invisible' : ''}>
            {isEditing ? 'Enregistrer les modifications' : 'Créer le dossier'}
          </span>
        </button>
      </div>
    </form>
  );
}

// ============================================================
// Sous-composants utilitaires (internes au module)
// ============================================================

/** Wrapper de champ avec label et message d'erreur — accessible (WCAG 2.1) */
function Field({
  label,
  error,
  required,
  children,
  fieldId,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  fieldId: string;
}) {
  const errorId = `${fieldId}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p id={errorId} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Génère les classes Tailwind pour un input, avec état d'erreur */
function inputClasses(fieldError?: { message?: string }): string {
  const base =
    'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

  return fieldError
    ? `${base} border-red-300 focus:border-red-400 focus:ring-red-500/20`
    : `${base} border-slate-200 focus:border-slate-300 focus:ring-slate-900/10`;
}
