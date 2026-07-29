export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 h-10 w-64 animate-pulse rounded bg-[var(--border)]" />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]" />
    </div>
  );
}
