'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface SearchResult {
  id: string;
  type: 'matter' | 'client' | 'event' | 'document';
  title: string;
  subtitle: string;
  href: string;
}

const TYPE_ICONS: Record<string, string> = {
  matter: '📂', client: '👤', event: '📅', document: '📄',
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.length < 2) { setResults([]); setOpen(false); return; }

    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        const supabase = createClient();
        const q = value.replace(/[%_]/g, '');
        const all: SearchResult[] = [];

        // Search matters
        const { data: matters } = await supabase.from('matters').select('id, title, reference').ilike('title', `%${q}%`).limit(4);
        (matters ?? []).forEach(m => all.push({ id: m.id, type: 'matter', title: m.title, subtitle: m.reference ?? 'Dossier', href: `/dashboard/dossiers/${m.id}` }));

        // Search clients
        const { data: clients } = await supabase.from('clients').select('id, full_name, phone').ilike('full_name', `%${q}%`).limit(4);
        (clients ?? []).forEach(c => all.push({ id: c.id, type: 'client', title: c.full_name, subtitle: c.phone ?? 'Client', href: `/dashboard/clients/${c.id}` }));

        // Search events
        const { data: events } = await supabase.from('events').select('id, title, starts_at').ilike('title', `%${q}%`).limit(3);
        (events ?? []).forEach(e => all.push({ id: e.id, type: 'event', title: e.title, subtitle: e.starts_at?.slice(0, 10) ?? '', href: `/dashboard/agenda/${e.id}` }));

        setResults(all);
        setOpen(all.length > 0);
      });
    }, 300);
  }

  function go(href: string) {
    setOpen(false);
    setQuery('');
    router.push(href);
  }

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="relative">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Rechercher…"
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => go(r.href)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50"
            >
              <span className="text-base">{TYPE_ICONS[r.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{r.title}</p>
                <p className="truncate text-xs text-slate-400">{r.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
