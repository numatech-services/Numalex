# 🎯 PLAN D'ACTION PRIORITAIRE - NumaLex
**Date:** 11 février 2026  
**Objectif:** Corrections immédiates pour passage en production

---

## 🔴 URGENT - À CORRIGER AVANT LANCEMENT (24-48h)

### 1. Éliminer les types `any`

#### Fichiers à modifier (par ordre de priorité)

**1.1. Créer les types manquants**
```typescript
// types/database.ts (nouveau fichier)

import type { Database } from './supabase';

// Types de base depuis Supabase
export type Matter = Database['public']['Tables']['matters']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];

// Types avec relations
export type MatterWithClient = Matter & {
  client: Client | null;
};

export type MatterWithRelations = Matter & {
  client: Client | null;
  events: Event[];
  documents: Document[];
};

export type InvoiceWithClient = Invoice & {
  client: Client | null;
};

export type InvoiceWithMatter = Invoice & {
  matter: Matter | null;
};

export type DocumentWithMatter = Document & {
  matter: Matter | null;
};

export type EventWithMatter = Event & {
  matter: Matter | null;
};
```

**1.2. Modifier lib/actions/ai.ts**
```typescript
// Ligne 95-96
// ❌ AVANT
Client : ${(matter.client as any)?.full_name ?? 'N/A'} (${(matter.client as any)?.client_type ?? ''})

// ✅ APRÈS
import type { MatterWithClient } from '@/types/database';

// Dans la fonction
const { data: matter } = await supabase
  .from('matters')
  .select(`
    id, title, reference, status, matter_type, jurisdiction, description, opened_at, updated_at,
    client:clients!matters_client_id_fkey(full_name, client_type, phone, email)
  `)
  .eq('id', request.matterId)
  .eq('cabinet_id', profile.cabinet_id)
  .single();

if (matter) {
  const typedMatter = matter as unknown as MatterWithClient;
  matterContext = `
DOSSIER : ${typedMatter.title} (Réf: ${typedMatter.reference ?? 'N/A'})
Client : ${typedMatter.client?.full_name ?? 'N/A'} (${typedMatter.client?.client_type ?? ''})
...
```

**1.3. Modifier app/client/documents/page.tsx**
```typescript
// Ligne 23
// ❌ AVANT
let docs: any[] = [];

// ✅ APRÈS
import type { DocumentWithMatter } from '@/types/database';
let docs: DocumentWithMatter[] = [];

// Ligne 67
// ❌ AVANT
<p className="text-xs text-slate-500">{(d.matter as any)?.title ?? ''}</p>

// ✅ APRÈS
<p className="text-xs text-slate-500">{d.matter?.title ?? ''}</p>
```

**1.4. Modifier app/dashboard/page.tsx**
```typescript
// Lignes 45-49
// ❌ AVANT
<RecentMatters matters={recentMatters as any} />
<TodayAgenda events={todayEvents as any} />
<AlertsPanel alerts={alerts as any} />
<OpenDocuments documents={documents as any} />
<TasksList tasks={tasks as any} />

// ✅ APRÈS
// En haut du fichier
import type { MatterWithClient } from '@/types/database';

// Props des composants
<RecentMatters matters={recentMatters ?? []} />
<TodayAgenda events={todayEvents ?? []} />
<AlertsPanel alerts={alerts ?? []} />
<OpenDocuments documents={documents ?? []} />
<TasksList tasks={tasks ?? []} />
```

**1.5. Modifier app/dashboard/factures/[id]/page.tsx**
```typescript
// Ligne 25
// ❌ AVANT
<InvoiceForm initialData={invoice as any} clients={clients ?? []} matters={matters ?? []} />

// ✅ APRÈS
import type { InvoiceWithClient, InvoiceWithMatter } from '@/types/database';

// Le composant InvoiceForm doit accepter le bon type
interface InvoiceFormProps {
  initialData?: Invoice;
  clients: Client[];
  matters: Matter[];
}

<InvoiceForm 
  initialData={invoice ?? undefined} 
  clients={clients ?? []} 
  matters={matters ?? []} 
/>
```

---

### 2. Variables d'environnement

**2.1. Créer .env.example**
```bash
# .env.example
# Copier ce fichier en .env.local et remplir les valeurs

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# IA Assistant (OPTIONNEL)
# Obtenez votre clé sur https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=

# Supabase Service Role (OPTIONNEL - uniquement pour scripts admin)
# ⚠️ NE JAMAIS exposer côté client
# SUPABASE_SERVICE_ROLE_KEY=
```

**2.2. Créer lib/env.ts**
```typescript
// lib/env.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const optionalEnvVars = [
  'ANTHROPIC_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

export function validateEnv() {
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const key of requiredEnvVars) {
    const value = process.env[key];
    
    if (!value) {
      missing.push(key);
    } else if (
      value.includes('VOTRE_') ||
      value.includes('YOUR_') ||
      value.includes('...')
    ) {
      invalid.push(key);
    }
  }

  if (missing.length > 0 || invalid.length > 0) {
    const errors: string[] = [];
    
    if (missing.length > 0) {
      errors.push(`Variables manquantes: ${missing.join(', ')}`);
    }
    
    if (invalid.length > 0) {
      errors.push(`Variables avec valeurs placeholder: ${invalid.join(', ')}`);
    }
    
    errors.push('');
    errors.push('Veuillez:');
    errors.push('1. Copier .env.example en .env.local');
    errors.push('2. Remplir toutes les valeurs requises');
    errors.push('3. Redémarrer le serveur');
    
    throw new Error(errors.join('\n'));
  }

  // Avertissements pour variables optionnelles
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY non configurée - L\'assistant IA fonctionnera en mode limité');
  }
}

// Type-safe env vars
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  ai: {
    anthropicKey: process.env.ANTHROPIC_API_KEY,
  },
} as const;
```

**2.3. Intégrer dans app/layout.tsx**
```typescript
// app/layout.tsx
import { validateEnv } from '@/lib/env';

// Valider au démarrage du serveur
if (typeof window === 'undefined') {
  validateEnv();
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ...
}
```

**2.4. Créer script de vérification**
```javascript
// scripts/check-env.js
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.error('❌ Fichier .env.local introuvable');
  console.error('');
  console.error('Veuillez:');
  console.error('1. Copier .env.example en .env.local');
  console.error('2. Remplir toutes les valeurs');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const placeholders = ['VOTRE_', 'YOUR_', '...'];

const hasPlaceholder = placeholders.some(p => envContent.includes(p));

if (hasPlaceholder) {
  console.error('❌ Le fichier .env.local contient des valeurs placeholder');
  console.error('');
  console.error('Veuillez remplir toutes les variables avec des valeurs réelles');
  process.exit(1);
}

console.log('✅ Variables d\'environnement OK');
```

**2.5. Modifier package.json**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "node scripts/check-env.js && next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "check-env": "node scripts/check-env.js"
  }
}
```

**2.6. Renommer .env actuel**
```bash
# Dans le terminal
mv .env .env.example
```

---

### 3. Gestion d'erreurs standardisée

**3.1. Créer lib/utils/api-response.ts**
```typescript
// lib/utils/api-response.ts
import type { PostgrestError } from '@supabase/supabase-js';

export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type ApiListResponse<T> = 
  | { success: true; data: T[]; count?: number }
  | { success: false; error: string; code?: string };

// Messages d'erreur en français
const ERROR_MESSAGES: Record<string, string> = {
  // Contraintes PostgreSQL
  '23505': 'Cet élément existe déjà.',
  '23503': 'Référence invalide. L\'élément lié n\'existe pas.',
  '23502': 'Champ obligatoire manquant.',
  '22P02': 'Format de donnée invalide.',
  
  // Permissions
  '42501': 'Permission insuffisante pour cette opération.',
  'PGRST301': 'Permission insuffisante (RLS).',
  
  // Autres
  'PGRST116': 'Élément introuvable.',
  'PGRST204': 'Aucun résultat.',
};

export function handleSupabaseError(error: PostgrestError): ApiResponse<never> {
  // Log structuré pour debugging
  if (process.env.NODE_ENV === 'production') {
    console.error('[Supabase Error]', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.error('[Supabase Error]', error);
  }

  // Message utilisateur
  const userMessage = ERROR_MESSAGES[error.code] ?? 
    'Une erreur est survenue. Veuillez réessayer.';

  return {
    success: false,
    error: userMessage,
    code: error.code,
  };
}

// Helper pour les erreurs inattendues
export function handleUnexpectedError(err: unknown): ApiResponse<never> {
  console.error('[Unexpected Error]', err);
  
  const message = err instanceof Error ? err.message : 'Erreur inconnue';
  
  return {
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur système. Veuillez contacter le support.'
      : message,
  };
}
```

**3.2. Exemple d'utilisation dans lib/actions/clients.ts**
```typescript
// lib/actions/clients.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { clientSchema } from '@/lib/validators/client';
import { handleSupabaseError, handleUnexpectedError } from '@/lib/utils/api-response';
import type { ApiResponse } from '@/lib/utils/api-response';
import type { Client } from '@/types/database';

export async function createClient(
  formData: FormData
): Promise<ApiResponse<Client>> {
  try {
    const supabase = createClient();

    // 1. Vérifier auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Session expirée.' };
    }

    // 2. Récupérer profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .eq('id', user.id)
      .single();
      
    if (!profile) {
      return { success: false, error: 'Profil introuvable.' };
    }

    // 3. Valider données
    const rawData = Object.fromEntries(formData.entries());
    const validated = clientSchema.parse(rawData);

    // 4. Insérer en DB
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        ...validated,
        cabinet_id: profile.cabinet_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    return { success: true, data: client };
  } catch (err) {
    // Erreurs de validation Zod
    if (err instanceof Error && err.name === 'ZodError') {
      return {
        success: false,
        error: 'Données invalides. Veuillez vérifier le formulaire.',
      };
    }
    
    // Autres erreurs
    return handleUnexpectedError(err);
  }
}
```

---

### 4. Corrections immédiates de sécurité

**4.1. Durcir le CSP**
```javascript
// next.config.js
async headers() {
  // Générer un nonce unique par requête (via middleware)
  // Pour l'instant, on garde unsafe-inline mais on note le TODO
  
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // TODO: Utiliser nonces
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests", // Force HTTPS en prod
  ].join('; ');

  return [
    {
      source: '/(.*)',
      headers: [
        // ... autres headers existants
        {
          key: 'Content-Security-Policy',
          value: csp,
        },
      ],
    },
  ];
}
```

**4.2. Ajouter .env.local au .gitignore (vérification)**
```bash
# .gitignore - Vérifier que ces lignes existent
.env
.env.local
.env.*.local
```

---

### 5. Validation des formulaires

**5.1. Créer composant FormField réutilisable**
```typescript
// components/ui/form-field.tsx
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  error,
  required,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="requis">*</span>}
      </label>
      
      {children}
      
      {hint && !error && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// Helper pour les classes conditionnelles
export function inputClassName(hasError?: boolean): string {
  const base = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors";
  
  if (hasError) {
    return `${base} border-red-300 focus:border-red-500 focus:ring-red-500`;
  }
  
  return `${base} border-slate-300 focus:border-blue-500 focus:ring-blue-500`;
}
```

**5.2. Exemple d'utilisation**
```typescript
// components/clients/client-form.tsx
import { FormField, inputClassName } from '@/components/ui/form-field';

export function ClientForm() {
  const { register, formState: { errors } } = useForm();
  
  return (
    <form>
      <FormField 
        label="Nom complet" 
        error={errors.full_name?.message}
        required
      >
        <input
          {...register('full_name')}
          type="text"
          className={inputClassName(!!errors.full_name)}
          placeholder="Ex: Jean Dupont"
        />
      </FormField>

      <FormField 
        label="Téléphone" 
        error={errors.phone?.message}
        hint="Format: +227 XX XX XX XX"
      >
        <input
          {...register('phone')}
          type="tel"
          className={inputClassName(!!errors.phone)}
          placeholder="+227 90 12 34 56"
        />
      </FormField>
    </form>
  );
}
```

---

## 📋 CHECKLIST DE DÉPLOIEMENT

Avant de lancer `npm run build` en production :

### Étape 1: Environnement
- [ ] Créer `.env.example` avec les variables vides
- [ ] Créer `.env.local` avec les vraies valeurs
- [ ] Vérifier que `.env.local` est dans `.gitignore`
- [ ] Créer `lib/env.ts` avec validation
- [ ] Créer `scripts/check-env.js`
- [ ] Modifier `package.json` pour ajouter le pre-build hook
- [ ] Tester: `npm run check-env`

### Étape 2: Types TypeScript
- [ ] Créer `types/database.ts` avec tous les types
- [ ] Remplacer tous les `any` dans `lib/actions/ai.ts`
- [ ] Remplacer tous les `any` dans `app/client/documents/page.tsx`
- [ ] Remplacer tous les `any` dans `app/dashboard/page.tsx`
- [ ] Remplacer tous les `any` dans `app/dashboard/factures/[id]/page.tsx`
- [ ] Remplacer tous les autres `any` (chercher avec `grep -r "any" app lib components`)
- [ ] Vérifier: `npm run type-check` (aucune erreur)

### Étape 3: Gestion d'erreurs
- [ ] Créer `lib/utils/api-response.ts`
- [ ] Modifier `lib/actions/clients.ts` pour utiliser `handleSupabaseError`
- [ ] Modifier `lib/actions/matters.ts`
- [ ] Modifier `lib/actions/invoices.ts`
- [ ] Modifier tous les autres fichiers d'actions
- [ ] Tester en local la création/modification d'entités

### Étape 4: UI/UX
- [ ] Créer `components/ui/form-field.tsx`
- [ ] Intégrer FormField dans `components/clients/client-form.tsx`
- [ ] Intégrer FormField dans `components/matters/matter-form.tsx`
- [ ] Intégrer FormField dans `components/invoices/invoice-form.tsx`
- [ ] Vérifier visuellement tous les formulaires

### Étape 5: Sécurité
- [ ] Durcir CSP dans `next.config.js`
- [ ] Vérifier que `.env.local` n'est pas commité
- [ ] Vérifier les headers de sécurité (tester avec securityheaders.com)
- [ ] Audit npm: `npm audit --production`

### Étape 6: Build & Test
- [ ] `npm run type-check` → ✅ Aucune erreur
- [ ] `npm run lint` → ✅ Aucune erreur
- [ ] `npm run build` → ✅ Build réussi
- [ ] `npm run start` → Tester manuellement les fonctionnalités critiques
- [ ] Vérifier les logs console (aucune erreur)

### Étape 7: Pre-production
- [ ] Créer une instance Supabase de staging
- [ ] Déployer sur Vercel/Railway/autre (staging)
- [ ] Tester l'authentification
- [ ] Tester la création d'un dossier
- [ ] Tester la création d'une facture
- [ ] Tester l'assistant IA (avec et sans clé API)
- [ ] Vérifier les performances (Lighthouse)

---

## 🚀 COMMANDES RAPIDES

```bash
# 1. Setup environnement
cp .env.example .env.local
# Éditer .env.local avec vos vraies valeurs

# 2. Installer dépendances (si besoin)
npm install

# 3. Vérifier environnement
npm run check-env

# 4. Type check
npm run type-check

# 5. Lint
npm run lint

# 6. Build
npm run build

# 7. Démarrer en production
npm run start
```

---

## 📞 EN CAS DE PROBLÈME

### Erreur de build TypeScript
```bash
# Nettoyer le cache Next.js
rm -rf .next

# Nettoyer node_modules
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Variables d'environnement invalides
```bash
# Vérifier le contenu
cat .env.local

# Tester la validation
node -e "require('./scripts/check-env.js')"
```

### Erreurs Supabase
```bash
# Vérifier la connexion
curl https://VOTRE_PROJECT_ID.supabase.co/rest/v1/

# Regénérer les types
npm run db:types
```

---

## 📊 MÉTRIQUES DE SUCCÈS

Après avoir appliqué ces corrections, vous devriez atteindre :

- ✅ **Type Safety:** 98%+ (0-2 `any` restants maximum)
- ✅ **Build:** Succès sans warnings
- ✅ **Env Validation:** Fail-fast si mauvaise config
- ✅ **Error Handling:** Messages utilisateurs clairs
- ✅ **Security:** Headers + CSP + no secrets in code

**Temps estimé pour tout appliquer:** 6-8 heures

---

**Prochaines étapes** (après ces corrections) :
1. Tests unitaires (validators + actions)
2. Optimisations performance (images, pagination)
3. Monitoring (Sentry, logs)
4. Documentation technique

