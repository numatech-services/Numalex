#!/usr/bin/env node
// ============================================================
// NumaLex — Script de vérification des variables d'environnement
// Exécuté automatiquement avant le build
// ============================================================

const fs = require('fs');
const path = require('path');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Chemins des fichiers
const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

// Variables requises
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

// Variables optionnelles avec avertissement
const optionalVars = [
  { key: 'NEXT_PUBLIC_APP_URL', message: 'URL de l\'application non définie (http://localhost:3000 utilisé)' },
  { key: 'ANTHROPIC_API_KEY', message: 'Assistant IA en mode limité (clé Anthropic manquante)' },
];

// Valeurs placeholder à détecter
const placeholders = ['VOTRE_', 'YOUR_', 'EXEMPLE', 'EXAMPLE', '...', 'XXX'];

/**
 * Affiche un message dans le terminal
 */
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

/**
 * Vérifie si une valeur est un placeholder
 */
function isPlaceholder(value) {
  return placeholders.some(p => value.includes(p));
}

/**
 * Vérifie l'existence et la validité du fichier .env.local
 */
function checkEnvFile() {
  const errors = [];
  const warnings = [];

  // 1. Vérifier que .env.local existe
  if (!fs.existsSync(envPath)) {
    log('', 'reset');
    log('❌ Fichier .env.local introuvable', 'red');
    log('', 'reset');
    log('Pour corriger:', 'yellow');
    log('  1. Copier .env.example en .env.local', 'reset');
    log('     cp .env.example .env.local', 'blue');
    log('  2. Éditer .env.local et remplir les valeurs', 'reset');
    log('  3. Relancer la commande', 'reset');
    log('', 'reset');
    
    if (fs.existsSync(envExamplePath)) {
      log('ℹ️  Fichier .env.example trouvé - vous pouvez l\'utiliser comme base', 'blue');
    }
    
    process.exit(1);
  }

  // 2. Lire le contenu
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');
  const envVars = {};

  // Parser les variables
  envLines.forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      envVars[match[1]] = match[2];
    }
  });

  // 3. Vérifier les variables requises
  requiredVars.forEach(key => {
    const value = envVars[key];
    
    if (!value || value.trim() === '') {
      errors.push(`${key} est vide ou manquante`);
    } else if (isPlaceholder(value)) {
      errors.push(`${key} contient une valeur placeholder: ${value.slice(0, 50)}...`);
    }
  });

  // 4. Vérifier les variables optionnelles
  optionalVars.forEach(({ key, message }) => {
    const value = envVars[key];
    if (!value || value.trim() === '') {
      warnings.push(message);
    }
  });

  // 5. En production, vérifier HTTPS
  if (process.env.NODE_ENV === 'production') {
    const appUrl = envVars.NEXT_PUBLIC_APP_URL;
    if (appUrl && !appUrl.startsWith('https://')) {
      errors.push('NEXT_PUBLIC_APP_URL doit utiliser HTTPS en production');
    }
  }

  // 6. Afficher les résultats
  if (errors.length > 0) {
    log('', 'reset');
    log('❌ Configuration des variables d\'environnement invalide', 'red');
    log('', 'reset');
    errors.forEach(err => {
      log(`  • ${err}`, 'red');
    });
    log('', 'reset');
    log('Pour corriger:', 'yellow');
    log('  1. Éditer .env.local', 'reset');
    log('  2. Remplir toutes les valeurs requises', 'reset');
    log('  3. Relancer la commande', 'reset');
    log('', 'reset');
    process.exit(1);
  }

  if (warnings.length > 0) {
    log('', 'reset');
    log('⚠️  Avertissements:', 'yellow');
    warnings.forEach(warn => {
      log(`  • ${warn}`, 'yellow');
    });
    log('', 'reset');
  }

  // Tout est OK
  log('✅ Variables d\'environnement validées', 'green');
  
  if (warnings.length === 0) {
    log('   Toutes les variables sont configurées correctement', 'green');
  }
  
  log('', 'reset');
}

// Exécution
try {
  checkEnvFile();
} catch (err) {
  log('', 'reset');
  log('❌ Erreur lors de la vérification:', 'red');
  log(`  ${err.message}`, 'red');
  log('', 'reset');
  process.exit(1);
}
