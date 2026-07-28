export default function CarDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="aspect-[4/3] animate-pulse rounded-[var(--radius)] bg-[var(--border)]" />
        <div className="space-y-3">
          <div className="h-8 w-3/4 animate-pulse rounded bg-[var(--border)]" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-[var(--border)]" />
          <div className="h-24 w-full animate-pulse rounded bg-[var(--border)]" />
          <div className="h-12 w-full animate-pulse rounded bg-[var(--border)]" />
        </div>
      </div>
    </div>
  );
}
