'use client';

import { useState, useTransition } from 'react';
import { toggleTask, createTask } from '@/lib/actions/tasks';
import { useToast } from '@/components/ui/toast';

const PRIORITY_DOT: Record<string, string> = {
  urgente: 'bg-red-500',
  haute: 'bg-orange-400',
  normal: 'bg-blue-400',
  basse: 'bg-slate-300',
};

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  completed: boolean;
  matter: { id: string; title: string } | null;
}

export function TasksList({ tasks: initialTasks }: { tasks: Task[] }) {
  const [isPending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState('');
  const { toast } = useToast();

  function handleToggle(taskId: string, completed: boolean) {
    startTransition(async () => {
      const r = await toggleTask(taskId, !completed);
      if (!r.success) toast('error', r.error ?? 'Erreur');
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const r = await createTask({ title: newTitle.trim() });
      if (r.success) {
        setNewTitle('');
        toast('success', 'Tâche ajoutée.');
      } else {
        toast('error', r.error ?? 'Erreur');
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Tâches</h2>

      {/* Add task */}
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nouvelle tâche…"
          disabled={isPending}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
        <button type="submit" disabled={isPending || !newTitle.trim()} className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50">
          +
        </button>
      </form>

      {initialTasks.length > 0 ? (
        <div className="space-y-1.5">
          {initialTasks.map((t) => (
            <button
              key={t.id}
              onClick={() => handleToggle(t.id, t.completed)}
              disabled={isPending}
              className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50"
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                t.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
              }`}>
                {t.completed && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${t.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</p>
                <div className="flex gap-2 text-[10px] text-slate-400">
                  {t.due_date && <span>{fmtDate(t.due_date)}</span>}
                  {t.matter?.title && <span>• {t.matter?.title}</span>}
                </div>
              </div>
              <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[t.priority] ?? PRIORITY_DOT.normal}`} title={t.priority} />
            </button>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-slate-400">Aucune tâche en cours</p>
      )}
    </div>
  );
}

function fmtDate(d: string) {
  try { return new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short' }).format(new Date(d)); }
  catch { return d; }
}
