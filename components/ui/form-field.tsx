// ============================================================
// NumaLex — Composant FormField réutilisable
// Uniformise l'affichage des champs de formulaire avec labels,
// erreurs, et hints
// ============================================================

import { AlertCircle, Info } from 'lucide-react';

interface FormFieldProps {
  /**
   * Label du champ (affiché au-dessus de l'input)
   */
  label: string;

  /**
   * Message d'erreur (affiché en rouge sous l'input)
   */
  error?: string;

  /**
   * Indique si le champ est obligatoire (affiche *)
   */
  required?: boolean;

  /**
   * Texte d'aide (affiché en gris sous l'input)
   */
  hint?: string;

  /**
   * ID du champ (pour l'attribut for du label)
   */
  htmlFor?: string;

  /**
   * Élément input/select/textarea à afficher
   */
  children: React.ReactNode;
}

/**
 * Composant de champ de formulaire avec label, erreur, et hint
 * 
 * @example
 * ```tsx
 * <FormField 
 *   label="Nom complet" 
 *   error={errors.name?.message}
 *   required
 *   hint="Prénom et nom de famille"
 * >
 *   <input {...register('name')} className={inputClassName(!!errors.name)} />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  error,
  required,
  hint,
  htmlFor,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      {/* Label */}
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
        {required && (
          <span
            className="text-red-500 ml-1"
            aria-label="champ requis"
            title="Champ obligatoire"
          >
            *
          </span>
        )}
      </label>

      {/* Input/Select/Textarea */}
      {children}

      {/* Hint (si pas d'erreur) */}
      {hint && !error && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Info className="h-3 w-3" aria-hidden="true" />
          <span>{hint}</span>
        </p>
      )}

      {/* Message d'erreur */}
      {error && (
        <p
          className="text-sm text-red-600 flex items-center gap-1.5"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Génère les classes CSS pour un input avec ou sans erreur
 * 
 * @param hasError - True si le champ a une erreur
 * @returns Classes CSS appropriées
 * 
 * @example
 * ```tsx
 * <input
 *   {...register('email')}
 *   className={inputClassName(!!errors.email)}
 * />
 * ```
 */
export function inputClassName(hasError?: boolean): string {
  const baseClasses =
    'w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 ' +
    'focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ' +
    'disabled:text-slate-500 disabled:cursor-not-allowed';

  if (hasError) {
    return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-500`;
  }

  return `${baseClasses} border-slate-300 focus:border-blue-500 focus:ring-blue-500`;
}

/**
 * Classes pour les selects
 */
export function selectClassName(hasError?: boolean): string {
  return inputClassName(hasError);
}

/**
 * Classes pour les textareas
 */
export function textareaClassName(hasError?: boolean): string {
  return `${inputClassName(hasError)} min-h-[100px] resize-y`;
}

/**
 * Classes pour les checkboxes
 */
export function checkboxClassName(): string {
  return (
    'h-4 w-4 text-blue-600 border-slate-300 rounded ' +
    'focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 ' +
    'transition-colors cursor-pointer'
  );
}

/**
 * Classes pour les radios
 */
export function radioClassName(): string {
  return checkboxClassName();
}

/**
 * Wrapper pour les checkboxes/radios avec label
 */
interface ChoiceFieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function ChoiceField({ label, hint, children }: ChoiceFieldProps) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <div className="space-y-2">{children}</div>
      {hint && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Info className="h-3 w-3" aria-hidden="true" />
          <span>{hint}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Option pour checkbox/radio
 */
interface ChoiceOptionProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export function ChoiceOption({
  label,
  description,
  children,
}: ChoiceOptionProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="flex items-center h-5">{children}</div>
      <div className="flex-1">
        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
          {label}
        </span>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}
