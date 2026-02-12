export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-80 rounded bg-slate-100" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border-l-4 border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="mt-3 h-7 w-12 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 h-4 w-32 rounded bg-slate-100" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3 rounded-xl p-2.5">
                  <div className="h-4 w-4 rounded bg-slate-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-slate-100" />
                    <div className="h-2.5 w-1/2 rounded bg-slate-50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Row 2 */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 h-4 w-32 rounded bg-slate-100" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-3 rounded-xl p-2.5">
                  <div className="h-5 w-5 rounded bg-slate-100" />
                  <div className="h-3.5 w-3/4 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
