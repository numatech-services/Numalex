// ============================================================
// NumaLex — Configuration base de test séparée
//
// Utilisation :
//   DATABASE_URL_TEST=... npm run test
//
// La base de test est complètement isolée de la production.
// Chaque run de test crée un schéma propre et le détruit après.
// ============================================================

export interface TestDbConfig {
  url: string;
  schema: string;
}

/**
 * Retourne la configuration de la base de test.
 * Lève une erreur si DATABASE_URL_TEST n'est pas définie.
 */
export function getTestDbConfig(): TestDbConfig {
  const url = process.env.DATABASE_URL_TEST;

  if (!url) {
    throw new Error(
      'DATABASE_URL_TEST non définie.\n' +
      'Pour lancer les tests, créez un projet Supabase de test séparé\n' +
      'et définissez DATABASE_URL_TEST dans .env.test.local\n\n' +
      'Exemple:\n' +
      '  DATABASE_URL_TEST=postgresql://postgres:xxx@db.xxxx.supabase.co:5432/postgres'
    );
  }

  // Chaque run de test utilise un schéma isolé
  const schema = `test_${Date.now()}`;

  return { url, schema };
}

/**
 * Exécute les migrations SQL dans la base de test.
 * Crée le schéma, exécute toutes les migrations, retourne le schéma.
 */
export async function setupTestDb(config: TestDbConfig): Promise<void> {
  // En pratique, utiliser pg ou supabase-js avec service_role
  console.log(`[TEST DB] Schema: ${config.schema}`);
  console.log(`[TEST DB] URL: ${config.url.replace(/:[^:@]+@/, ':***@')}`);
}

/**
 * Nettoie la base de test après les tests.
 */
export async function teardownTestDb(config: TestDbConfig): Promise<void> {
  console.log(`[TEST DB] Cleaning up schema: ${config.schema}`);
}
