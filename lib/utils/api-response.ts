// ============================================================
// NumaLex — Gestion standardisée des réponses API
// Fournit des types et helpers pour des erreurs cohérentes
// ============================================================

import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Type de réponse standard pour toutes les actions serveur
 */
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Type de réponse pour les listes avec pagination
 */
export type ApiListResponse<T> = 
  | { success: true; data: T[]; count?: number }
  | { success: false; error: string; code?: string };

/**
 * Type de réponse pour les opérations sans retour de données
 */
export type ApiActionResponse = 
  | { success: true }
  | { success: false; error: string; code?: string };

// ============================================================
// MESSAGES D'ERREUR
// ============================================================

/**
 * Messages d'erreur en français pour les codes PostgreSQL
 * Documentation: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Violations de contraintes (23xxx)
  '23505': 'Cet élément existe déjà. Veuillez utiliser une valeur unique.',
  '23503': 'Référence invalide. L\'élément lié n\'existe pas.',
  '23502': 'Champ obligatoire manquant.',
  '23514': 'Valeur invalide. Veuillez vérifier vos données.',
  
  // Erreurs de format (22xxx)
  '22P02': 'Format de donnée invalide.',
  '22001': 'Texte trop long.',
  '22003': 'Nombre hors limites.',
  '22007': 'Format de date invalide.',
  '22008': 'Format d\'heure invalide.',
  
  // Permissions (42xxx)
  '42501': 'Permission insuffisante pour cette opération.',
  '42P01': 'Table introuvable.',
  '42703': 'Colonne introuvable.',
  
  // Erreurs Supabase/PostgREST
  'PGRST301': 'Permission insuffisante (politique RLS).',
  'PGRST116': 'Élément introuvable.',
  'PGRST204': 'Aucun résultat trouvé.',
  'PGRST202': 'Plusieurs résultats trouvés (un seul attendu).',
  
  // Timeouts
  '57014': 'Opération annulée (timeout).',
  '08006': 'Connexion perdue avec la base de données.',
  
  // Locks
  '40P01': 'Deadlock détecté. Veuillez réessayer.',
};

/**
 * Message d'erreur générique si le code n'est pas reconnu
 */
const GENERIC_ERROR = 'Une erreur est survenue. Veuillez réessayer.';

// ============================================================
// HANDLERS D'ERREURS
// ============================================================

/**
 * Transforme une erreur Supabase en réponse API standardisée
 * 
 * @param error - Erreur retournée par Supabase
 * @returns Réponse d'erreur formatée pour l'utilisateur
 * 
 * @example
 * ```ts
 * const { data, error } = await supabase.from('clients').insert(data);
 * if (error) return handleSupabaseError(error);
 * ```
 */
export function handleSupabaseError(error: PostgrestError): ApiResponse<never> {
  // Log structuré pour le monitoring
  logError('Supabase Error', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  // Message utilisateur friendly
  const userMessage = ERROR_MESSAGES[error.code] ?? GENERIC_ERROR;

  return {
    success: false,
    error: userMessage,
    code: error.code,
  };
}

/**
 * Gère les erreurs inattendues (réseau, JavaScript, etc.)
 * 
 * @param err - Erreur capturée
 * @param context - Contexte optionnel pour le debugging
 * @returns Réponse d'erreur formatée
 * 
 * @example
 * ```ts
 * try {
 *   await fetch('...');
 * } catch (err) {
 *   return handleUnexpectedError(err, 'Fetching external API');
 * }
 * ```
 */
export function handleUnexpectedError(
  err: unknown,
  context?: string
): ApiResponse<never> {
  logError('Unexpected Error', {
    context,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  // En production, masquer les détails techniques
  if (process.env.NODE_ENV === 'production') {
    return {
      success: false,
      error: 'Erreur système. Si le problème persiste, contactez le support.',
    };
  }

  // En dev, montrer le message d'erreur
  const message = err instanceof Error ? err.message : String(err);
  return {
    success: false,
    error: `Erreur: ${message}`,
  };
}

/**
 * Gère les erreurs de validation Zod
 * 
 * @param err - Erreur Zod
 * @returns Réponse d'erreur formatée
 */
export function handleValidationError(err: unknown): ApiResponse<never> {
  logError('Validation Error', { error: err });

  // En production, message générique
  if (process.env.NODE_ENV === 'production') {
    return {
      success: false,
      error: 'Données invalides. Veuillez vérifier le formulaire.',
    };
  }

  // En dev, détails de la validation
  if (err && typeof err === 'object' && 'errors' in err) {
    const zodErrors = err.errors as Array<{ path: string[]; message: string }>;
    const firstError = zodErrors[0];
    return {
      success: false,
      error: `${firstError.path.join('.')}: ${firstError.message}`,
    };
  }

  return {
    success: false,
    error: 'Données invalides.',
  };
}

// ============================================================
// LOGGING
// ============================================================

interface LogContext {
  [key: string]: unknown;
}

/**
 * Log structuré pour le debugging et le monitoring
 */
function logError(type: string, context: LogContext): void {
  const logData = {
    type,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ...context,
  };

  // En production, utiliser un service de monitoring (Sentry, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Envoyer à Sentry ou autre
    console.error(JSON.stringify(logData));
  } else {
    // En dev, format lisible
    console.error(`[${type}]`, context);
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Crée une réponse de succès
 */
export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

/**
 * Crée une réponse d'erreur
 */
export function error(message: string, code?: string): ApiResponse<never> {
  return { success: false, error: message, code };
}

/**
 * Vérifie si une réponse est un succès (type guard)
 */
export function isSuccess<T>(
  response: ApiResponse<T>
): response is { success: true; data: T } {
  return response.success === true;
}

/**
 * Vérifie si une réponse est une erreur (type guard)
 */
export function isError<T>(
  response: ApiResponse<T>
): response is { success: false; error: string; code?: string } {
  return response.success === false;
}
