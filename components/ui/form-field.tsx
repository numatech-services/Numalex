// ============================================================
// NumaLex — Composant FormField réutilisable
// Uniformise l'affichage des champs de formulaire
// ============================================================

import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

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
          {/* Icône Info en SVG simple */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
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
          {/* Icône Alert en SVG simple */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// Les fonctions utilitaires (inputClassName, etc.) restent inchangées
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

export function selectClassName(hasError?: boolean): string {
  return inputClassName(hasError);
}

export function textareaClassName(hasError?: boolean): string {
  return `${inputClassName(hasError)} min-h-[100px] resize-y`;
}

export function checkboxClassName(): string {
  return (
    'h-4 w-4 text-blue-600 border-slate-300 rounded ' +
    'focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 ' +
    'transition-colors cursor-pointer'
  );
}

export function ChoiceField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <div className="space-y-2">{children}</div>
      {hint && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
           <span>{hint}</span>
        </p>
      )}
    </div>
  );
}

export function ChoiceOption({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
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
