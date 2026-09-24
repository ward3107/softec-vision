// Instant catalog skeleton: the category page resolves its products on the
// server, so this placeholder appears the moment a family is opened.
export default function CatalogCategoryLoading() {
  return (
    <div className="mx-auto max-w-shell animate-pulse px-[clamp(20px,4.5vw,72px)] py-10" aria-hidden="true">
      <div className="h-8 w-64 max-w-full rounded bg-line" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-line/70" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line bg-pure p-4 dark:border-white/10 dark:bg-surface">
            <div className="aspect-[4/3] w-full rounded-lg bg-line" />
            <div className="mt-4 h-5 w-32 rounded bg-line" />
            <div className="mt-2 h-4 w-full rounded bg-line/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
