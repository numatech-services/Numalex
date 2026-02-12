// ============================================================
// NumaLex — Validation des variables d'environnement
// Importé dans app/layout.tsx pour validation au démarrage.
// ============================================================

interface EnvVar {
  key: string;
  required: boolean;
  message: string;
  validate?: (value: string) => boolean;
}

const ENV_VARS: EnvVar[] = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    message: 'URL Supabase manquante. Voir .env.example.',
    validate: (v) => v.startsWith('https://') && v.includes('.supabase.co'),
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    message: 'Clé anonyme Supabase manquante. Voir .env.example.',
    validate: (v) => v.startsWith('eyJ') && v.length > 100,
  },
  {
    key: 'ANTHROPIC_API_KEY',
    required: false,
    message: 'Clé Anthropic absente — assistant IA en mode template.',
  },
];

const PLACEHOLDER_PATTERNS = ['VOTRE_', 'YOUR_', 'EXEMPLE', 'EXAMPLE', '...', 'XXX'];

/**
 * Valide les variables d'environnement au démarrage du serveur.
 * Lance une erreur si une variable obligatoire est manquante.
 */
export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key];

    if (!value || value.trim() === '') {
      if (envVar.required) {
        errors.push(`❌ ${envVar.key}: ${envVar.message}`);
      } else {
        warnings.push(`⚠️ ${envVar.key}: ${envVar.message}`);
      }
      continue;
    }

    // Vérifier les placeholders
    if (PLACEHOLDER_PATTERNS.some((p) => value.includes(p))) {
      errors.push(`❌ ${envVar.key}: contient un placeholder (${value.slice(0, 30)}...)`);
      continue;
    }

    // Validation personnalisée
    if (envVar.validate && !envVar.validate(value)) {
      errors.push(`❌ ${envVar.key}: format invalide`);
    }
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('\n' + warnings.join('\n') + '\n');
  }

  if (errors.length > 0) {
    console.error('\n═══ CONFIGURATION INVALIDE ═══');
    console.error(errors.join('\n'));
    console.error('\nCopiez .env.example en .env.local et remplissez les valeurs.');
    console.error('═══════════════════════════════\n');

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Configuration invalide. Variables d\'environnement manquantes.');
    }
  }
}
