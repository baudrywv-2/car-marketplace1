"use client";

import { useLocale } from "@/app/contexts/LocaleContext";
import { formatLastSeenLabel } from "@/lib/presence";

type Props = {
  lastSeen?: string | null;
  className?: string;
};

export default function UserPresenceBadge({ lastSeen, className = "" }: Props) {
  const { t } = useLocale();
  const { online, label } = formatLastSeenLabel(lastSeen, t);

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${
        online ? "text-emerald-400" : "text-[var(--muted-foreground)]"
      } ${className}`}
      title={lastSeen ? new Date(lastSeen).toLocaleString() : undefined}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          online ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" : "bg-white/25"
        }`}
        aria-hidden
      />
      {label}
    </span>
  );
}
