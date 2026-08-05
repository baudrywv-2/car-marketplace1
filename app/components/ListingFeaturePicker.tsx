"use client";

import { useState } from "react";
import { CAR_FEATURES } from "@/lib/constants";
import { useLocale } from "@/app/contexts/LocaleContext";

const POPULAR_COUNT = 12;

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export default function ListingFeaturePicker({ value, onChange }: Props) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);

  const popular = CAR_FEATURES.slice(0, POPULAR_COUNT);
  const rest = CAR_FEATURES.slice(POPULAR_COUNT);
  const selectedOutsidePopular = rest.filter((f) => value.includes(f.id));
  const visible = expanded
    ? CAR_FEATURES
    : [...popular, ...selectedOutsidePopular.filter((f) => !popular.some((p) => p.id === f.id))];

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  return (
    <div>
      <label className="mb-2 block text-caption font-medium text-[var(--foreground)]">{t("features")}</label>
      <p className="mb-3 text-[11px] text-[var(--muted-foreground)]">
        {expanded ? t("selectAllThatApply") : t("showPopularFeatures")}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {visible.map((f) => {
          const selected = value.includes(f.id);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => toggle(f.id)}
              className={`rounded-lg border px-3 py-2 text-left text-[11px] font-medium transition ${
                selected
                  ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)]"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              }`}
            >
              {f.labelKey ? t(f.labelKey as Parameters<typeof t>[0]) : f.labelEn}
            </button>
          );
        })}
      </div>
      {rest.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-caption font-medium text-[var(--accent)] hover:underline"
        >
          {expanded ? t("hideExtraFeatures") : t("showAllFeatures")}
        </button>
      )}
    </div>
  );
}
