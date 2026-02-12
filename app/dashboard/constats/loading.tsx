export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div><div className="h-7 w-48 rounded-lg bg-slate-200" /><div className="mt-2 h-4 w-64 rounded bg-slate-100" /></div>
        <div className="h-10 w-36 rounded-lg bg-slate-200" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-0">{[1,2,3,4,5].map(i => (
          <div key={i} className="flex items-center gap-4 border-b border-slate-50 px-5 py-4">
            <div className="h-10 w-10 rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2"><div className="h-4 w-48 rounded bg-slate-100" /><div className="h-3 w-32 rounded bg-slate-50" /></div>
            <div className="h-8 w-20 rounded-lg bg-slate-100" />
          </div>
        ))}</div>
      </div>
    </div>
  );
}
