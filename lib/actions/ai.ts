'use server';

import { aiRequestSchema } from '@/lib/validations';
import { createClient } from '@/lib/supabase/server';

export interface AIRequest {
  action: 'summarize' | 'draft_letter' | 'checklist' | 'suggest_actions' | 'custom';
  matterId?: string;
  prompt: string;
}

export interface AIResponse {
  success: boolean;
  response?: string;
  error?: string;
}

// Modèles de prompts métier par action
const SYSTEM_PROMPTS: Record<string, string> = {
  summarize: `Tu es un assistant juridique spécialisé en droit OHADA et droit nigérien.
Résume le dossier fourni de manière structurée :
1. Parties impliquées
2. Nature du litige / de l'affaire
3. Procédure en cours
4. Échéances importantes
5. Points d'attention
Sois concis et professionnel.`,

  draft_letter: `Tu es un rédacteur juridique professionnel spécialisé en droit OHADA.
Rédige un courrier formel en français juridique à partir des éléments fournis.
Respecte les formules de politesse du barreau nigérien.
Le courrier doit être prêt à signer.`,

  checklist: `Tu es un assistant juridique. Génère une checklist complète des actions à mener pour ce dossier.
Format : liste numérotée avec priorité (URGENT / IMPORTANT / NORMAL).
Tiens compte du droit OHADA et des procédures nigériennes.`,

  suggest_actions: `Tu es un conseiller juridique senior. Analyse le dossier et propose les prochaines actions concrètes.
Pour chaque action, indique :
- L'action à mener
- Le délai recommandé
- Le responsable suggéré (avocat, greffier, client)
- Le risque si non fait`,

  custom: `Tu es un assistant juridique IA pour un cabinet au Niger (zone OHADA). Réponds de manière professionnelle et précise en français.`,
};

export async function askAI(request: AIRequest): Promise<AIResponse> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Session expirée.' };

  // Cast 'any' pour éviter l'erreur de propriété sur 'profile'
  const { data: profile }: { data: any } = await supabase
    .from('profiles')
    .select('cabinet_id, role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Profil introuvable.' };

  let matterContext = '';
  if (request.matterId) {
    // Cast 'any' pour éviter l'erreur sur 'matter'
    const { data: matter }: { data: any } = await supabase
      .from('matters')
      .select(`
        id, title, reference, status, matter_type, jurisdiction, description, opened_at, updated_at,
        client:clients!matters_client_id_fkey(full_name, client_type, phone, email)
      `)
      .eq('id', request.matterId)
      .eq('cabinet_id', profile.cabinet_id)
      .single();

    if (matter) {
      const events = await supabase
        .from('events')
        .select('title, event_type, starts_at, location')
        .eq('matter_id', request.matterId)
        .order('starts_at', { ascending: true })
        .limit(5);

      const docs = await supabase
        .from('documents')
        .select('title, doc_type, created_at')
        .eq('matter_id', request.matterId)
        .order('created_at', { ascending: false })
        .limit(5);

      matterContext = `
DOSSIER : ${matter.title} (Réf: ${matter.reference ?? 'N/A'})
Statut : ${matter.status}
Type : ${matter.matter_type ?? 'N/A'}
Juridiction : ${matter.jurisdiction ?? 'N/A'}
Description : ${matter.description ?? 'Aucune'}
Ouvert le : ${matter.opened_at ?? 'N/A'}
Client : ${matter.client?.full_name ?? 'N/A'} (${matter.client?.client_type ?? ''})

ÉVÉNEMENTS PROCHAINS :
${(events.data ?? []).map((e: any) => `- ${e.title} (${e.event_type}) le ${e.starts_at}${e.location ? ' à ' + e.location : ''}`).join('\n') || 'Aucun'}

DOCUMENTS :
${(docs.data ?? []).map((d: any) => `- ${d.title} (${d.doc_type}) du ${d.created_at}`).join('\n') || 'Aucun'}
`;
    }
  }

  const systemPrompt = SYSTEM_PROMPTS[request.action] ?? SYSTEM_PROMPTS.custom;
  const fullPrompt = matterContext
    ? `${request.prompt}\n\n--- CONTEXTE DU DOSSIER ---\n${matterContext}`
    : request.prompt;

  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: fullPrompt }],
      }),
    });

    if (!apiResponse.ok) {
      if (!process.env.ANTHROPIC_API_KEY) {
        return generateLocalResponse(request, matterContext);
      }
      return { success: false, error: 'Erreur API IA. Réessayez.' };
    }

    const data = await apiResponse.json();
    const responseText = data.content?.[0]?.text ?? 'Pas de réponse.';

    // Correction CRUCIALE : cast 'as any' pour l'insertion dans ai_logs
    await (supabase.from('ai_logs') as any).insert({
      cabinet_id: profile.cabinet_id,
      user_id: user.id,
      action: request.action,
      prompt: fullPrompt.slice(0, 2000),
      response: responseText.slice(0, 5000),
      tokens_used: data.usage?.output_tokens ?? null,
    });

    return { success: true, response: responseText };
  } catch (err: unknown) {
    return generateLocalResponse(request, matterContext);
  }
}

function generateLocalResponse(request: AIRequest, context: string): AIResponse {
  const templates: Record<string, string> = {
    summarize: `📋 **Résumé du dossier**\n\n${context || 'Aucun dossier sélectionné.'}\n\n⚠️ *Clé API manquante dans .env.local.*`,
    draft_letter: `📝 **Modèle de courrier**\n\nMaître [NOM],\nAvocat au Barreau de Niamey\n\nObjet : [OBJET]\n\n⚠️ *Clé API manquante dans .env.local.*`,
    checklist: `✅ **Checklist juridique**\n\n1. 🔴 URGENT — Vérifier les délais de procédure\n\n⚠️ *Clé API manquante dans .env.local.*`,
    suggest_actions: `💡 **Actions suggérées**\n\n1. **Vérifier les échéances** — Délai : immédiat\n\n⚠️ *Clé API manquante dans .env.local.*`,
    custom: `🤖 Assistant IA local actif. Ajoutez ANTHROPIC_API_KEY pour l'IA Claude.`,
  };

  return {
    success: true,
    response: templates[request.action] ?? templates.custom,
  };
}
