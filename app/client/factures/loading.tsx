export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
      <div className="h-7 w-48 rounded-lg bg-slate-200" />
      <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="h-8 w-8 rounded-lg bg-slate-100" />
            <div className="mt-3 h-8 w-16 rounded bg-slate-100" />
            <div className="mt-2 h-4 w-24 rounded bg-slate-50" />
          </div>
        ))}
      </div>
    </div>
  );
}
