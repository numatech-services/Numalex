'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { askAI, type AIRequest, type AIResponse } from '@/lib/actions/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { action: 'summarize', label: 'Résumer le dossier', icon: '📋' },
  { action: 'draft_letter', label: 'Rédiger un courrier', icon: '📝' },
  { action: 'checklist', label: 'Générer une checklist', icon: '✅' },
  { action: 'suggest_actions', label: 'Suggérer des actions', icon: '💡' },
] as const;

interface Props {
  matters: { id: string; title: string }[];
}

export function AIAssistant({ matters }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedMatter, setSelectedMatter] = useState('');
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function send(action: AIRequest['action'], prompt: string) {
    if (!prompt.trim() && action === 'custom') return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt || QUICK_ACTIONS.find(a => a.action === action)?.label || action,
      action,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    startTransition(async () => {
      const result: AIResponse = await askAI({
        action,
        matterId: selectedMatter || undefined,
        prompt: prompt || `Exécute l'action "${action}" sur le dossier sélectionné.`,
      });

      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.success ? (result.response ?? 'Pas de réponse.') : `Erreur : ${result.error}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send('custom', input);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg text-white shadow-sm">
            🤖
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Assistant IA</h2>
            <p className="text-xs text-slate-500">Analyse juridique, rédaction, suggestions</p>
          </div>
        </div>
        <select
          value={selectedMatter}
          onChange={(e) => setSelectedMatter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        >
          <option value="">— Tous les dossiers —</option>
          {matters.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 border-b border-slate-50 px-5 py-3">
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.action}
            onClick={() => send(qa.action, '')}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"
          >
            <span>{qa.icon}</span> {qa.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-3xl">🤖</div>
            <h3 className="mt-4 font-semibold text-slate-900">Assistant juridique IA</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Posez une question, sélectionnez un dossier et utilisez les actions rapides pour obtenir de l'aide.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-900'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <p className={`mt-1 text-[10px] ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-100 px-5 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question juridique…"
            disabled={isPending}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </button>
        </div>
      </form>
    </div>
  );
}
