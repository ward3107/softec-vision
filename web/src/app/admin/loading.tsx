// Content skeleton shown while an admin page (all force-dynamic) renders. The
// persistent nav shell (rendered by the layout) stays put around it, so only
// this content area swaps in — navigation feels immediate, not frozen.
export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-7 w-40 rounded bg-line" />
      <div className="mt-2 h-4 w-56 rounded bg-line/70" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-line bg-pure p-5 dark:border-white/10 dark:bg-surface">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-line" />
              <div className="h-4 w-24 rounded bg-line" />
            </div>
            <div className="mt-5 h-9 w-20 rounded bg-line" />
            <div className="mt-3 h-4 w-32 rounded bg-line/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
