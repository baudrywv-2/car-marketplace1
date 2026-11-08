"use client";

import { useLocale } from "@/app/contexts/LocaleContext";

export type ListingChecklistState = {
  photos: boolean;
  title: boolean;
  makeModel: boolean;
  type: boolean;
  price: boolean;
  contact: boolean;
  location: boolean;
};

type Props = {
  state: ListingChecklistState;
  needsSalePrice: boolean;
};

export default function ListingPublishChecklist({ state, needsSalePrice }: Props) {
  const { t } = useLocale();

  const items: { key: keyof ListingChecklistState; label: string; skip?: boolean }[] = [
    { key: "photos", label: t("listingPhotosFirst") },
    { key: "title", label: t("title") },
    { key: "makeModel", label: `${t("make")} / ${t("model")}` },
    { key: "type", label: t("vehicleType") },
    { key: "price", label: t("salePrice"), skip: !needsSalePrice },
    { key: "location", label: t("shopByTownCity") },
    { key: "contact", label: t("phone") },
  ];

  const visible = items.filter((i) => !i.skip);
  const done = visible.filter((i) => state[i.key]).length;
  const total = visible.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="mb-5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold text-[var(--foreground)]">{t("listingChecklist")}</p>
        <span className="text-[11px] tabular-nums text-[var(--muted-foreground)]">
          {done}/{total}
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {visible.map((item) => {
          const ok = state[item.key];
          return (
            <li
              key={item.key}
              className={`flex min-h-9 items-center gap-1.5 rounded-md px-2 text-[11px] ${
                ok ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                  ok ? "bg-[var(--accent)] text-black" : "border border-[var(--border)]"
                }`}
                aria-hidden
              >
                {ok ? "✓" : ""}
              </span>
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
