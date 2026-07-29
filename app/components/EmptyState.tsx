"use client";

import Link from "next/link";

type Props = {
  title: string;
  hint?: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

/** Consistent empty-state block for browse/dashboard surfaces */
export default function EmptyState({ title, hint, actionHref, actionLabel, onAction, className = "" }: Props) {
  const showAction = Boolean(actionLabel && (actionHref || onAction));

  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--card)]/60 px-5 py-10 text-center ${className}`}
      role="status"
    >
      <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      {hint && <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-[var(--muted-foreground)]">{hint}</p>}
      {showAction && actionHref && actionLabel && (
        <Link href={actionHref} className="btn-accent mt-5 inline-flex min-h-10 px-4 text-[12px]">
          {actionLabel}
        </Link>
      )}
      {showAction && !actionHref && onAction && actionLabel && (
        <button type="button" onClick={onAction} className="btn-accent mt-5 inline-flex min-h-10 px-4 text-[12px]">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
