export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[35vh] w-full max-w-6xl items-center justify-center px-4 py-14">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
