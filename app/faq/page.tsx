"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/app/contexts/LocaleContext";

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[var(--border)] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-body font-medium text-[var(--foreground)]">{q}</span>
        <span className="ml-2 shrink-0 text-[var(--muted-foreground)]">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="pb-4 text-caption text-[var(--muted-foreground)]">{a}</p>}
    </div>
  );
}

export default function FAQPage() {
  const { t } = useLocale();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-heading mb-8 text-[var(--foreground)]">{t("faq")}</h1>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4">
        <FAQItem
          q={t("faq1Q")}
          a={t("faq1A")}
          open={faqOpen === 1}
          onToggle={() => setFaqOpen(faqOpen === 1 ? null : 1)}
        />
        <FAQItem
          q={t("faq2Q")}
          a={t("faq2A")}
          open={faqOpen === 2}
          onToggle={() => setFaqOpen(faqOpen === 2 ? null : 2)}
        />
        <FAQItem
          q={t("faq3Q")}
          a={t("faq3A")}
          open={faqOpen === 3}
          onToggle={() => setFaqOpen(faqOpen === 3 ? null : 3)}
        />
        <FAQItem
          q={t("faq4Q")}
          a={t("faq4A")}
          open={faqOpen === 4}
          onToggle={() => setFaqOpen(faqOpen === 4 ? null : 4)}
        />
      </div>

      <section className="mt-14 border-t border-[var(--border)] pt-10">
        <h2 className="text-subheading mb-6 text-[var(--foreground)]">{t("whatPeopleSay")}</h2>
        <div className="space-y-6">
          <blockquote className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <p className="text-body text-[var(--foreground)]">"{t("testimonial1")}"</p>
            <cite className="mt-3 block text-caption not-italic text-[var(--muted-foreground)]">{t("testimonial1Author")}</cite>
          </blockquote>
          <blockquote className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <p className="text-body text-[var(--foreground)]">"{t("testimonial2")}"</p>
            <cite className="mt-3 block text-caption not-italic text-[var(--muted-foreground)]">{t("testimonial2Author")}</cite>
          </blockquote>
        </div>
      </section>

      <p className="mt-10">
        <Link href="/" className="link-accent text-small font-medium">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
