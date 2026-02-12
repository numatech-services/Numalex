'use client';

import { useTransition } from 'react';
import { markAlertRead } from '@/lib/actions/tasks';

const LEVEL_STYLES: Record<string, { icon: string; border: string; bg: string; text: string }> = {
  critical: { icon: '🔴', border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-800' },
  warning: { icon: '🟠', border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-800' },
  info: { icon: '🔵', border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-800' },
};

interface Alert {
  id: string;
  message: string;
  level: string;
  read: boolean;
  created_at: string;
  matter: { id: string; title: string } | null;
}

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  const [isPending, startTransition] = useTransition();
  const unread = alerts.filter((a) => !a.read);

  function dismiss(alertId: string) {
    // Correction : On appelle l'action à l'intérieur d'un bloc async 
    // qui ne retourne rien au startTransition
    startTransition(async () => {
      await markAlertRead(alertId);
    });
  }

  return (
    <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-orange-600">
          Alertes {unread.length > 0 && <span className="ml-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] text-white">{unread.length}</span>}
        </h2>
      </div>
      {alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.slice(0, 6).map((a) => {
            const style = LEVEL_STYLES[a.level] ?? LEVEL_STYLES.info;
            return (
              <div
                key={a.id}
                className={`flex items-start gap-2.5 rounded-xl border-l-4 ${style.border} ${style.bg} p-3 ${a.read ? 'opacity-50' : ''}`}
              >
                <span className="mt-0.5 text-sm">{style.icon}</span>
                <p className={`flex-1 text-xs font-medium ${style.text}`}>{a.message}</p>
                {!a.read && (
                  <button
                    onClick={() => dismiss(a.id)}
                    disabled={isPending}
                    className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600"
                    title="Marquer comme lu"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-slate-400">Aucune alerte</p>
      )}
    </div>
  );
}
