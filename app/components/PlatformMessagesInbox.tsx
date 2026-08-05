"use client";

import { useLocale } from "@/app/contexts/LocaleContext";

export type PlatformAdminMessage = {
  id: string;
  subject: string;
  body: string;
  created_at: string;
};

type Props = {
  messages: PlatformAdminMessage[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
};

/** Shared inbox card for seller/buyer dashboards. */
export default function PlatformMessagesInbox({ messages, onDismiss, onClearAll }: Props) {
  const { t } = useLocale();
  if (!messages.length) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--accent)]/30 bg-[var(--card)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-black/35 px-4 py-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            {t("messagesFromAdmin")}
          </h2>
          <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">{t("platformInboxHint")}</p>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="shrink-0 text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          {t("clearAll")}
        </button>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {messages.map((m) => (
          <li key={m.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug text-[var(--foreground)]">{m.subject}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--muted-foreground)]">
                {m.body}
              </p>
              <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(m.id)}
              className="shrink-0 rounded border border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
            >
              {t("dismiss")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
