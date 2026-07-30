"use client";

import { useEffect, useRef, useState } from "react";
import BuyerCarCard, { type BuyerCarCardData } from "@/app/components/BuyerCarCard";
import CarCardSkeleton from "@/app/components/CarCardSkeleton";
import { useLocale } from "@/app/contexts/LocaleContext";

type Props = {
  cars: BuyerCarCardData[];
  loading?: boolean;
  autoPlay?: boolean;
};

const CARD_W =
  "w-[min(72vw,210px)] shrink-0 snap-start sm:w-[180px] md:w-[190px] lg:w-[200px] xl:w-[210px]";

export default function HomeOffersCarousel({ cars, loading, autoPlay = true }: Props) {
  const { t } = useLocale();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.78, 360);
    const max = el.scrollWidth - el.clientWidth;
    const next = el.scrollLeft + dir * amount;
    if (dir > 0 && next >= max - 8) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir < 0 && el.scrollLeft <= 8) {
      el.scrollTo({ left: max, behavior: "smooth" });
    } else {
      el.scrollBy({ left: dir * amount, behavior: "smooth" });
    }
  }

  useEffect(() => {
    if (!autoPlay || paused || loading || cars.length < 2) return;
    const id = window.setInterval(() => scrollByDir(1), 5000);
    return () => window.clearInterval(id);
  }, [autoPlay, paused, loading, cars.length]);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden" aria-label={t("featuredLoading")}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={CARD_W}>
            <CarCardSkeleton compact />
          </div>
        ))}
      </div>
    );
  }

  if (cars.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <button
        type="button"
        onClick={() => scrollByDir(-1)}
        className="absolute -left-1 top-[34%] z-[2] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--accent)] text-black transition hover:bg-[var(--accent-hover)] sm:flex lg:-left-2"
        aria-label={t("previous")}
      >
        <span aria-hidden className="text-xl font-bold leading-none">
          ‹
        </span>
      </button>
      <button
        type="button"
        onClick={() => scrollByDir(1)}
        className="absolute -right-1 top-[34%] z-[2] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--accent)] text-black transition hover:bg-[var(--accent-hover)] sm:flex lg:-right-2"
        aria-label={t("next")}
      >
        <span aria-hidden className="text-xl font-bold leading-none">
          ›
        </span>
      </button>

      <div
        ref={scrollerRef}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-6 md:px-7 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {cars.map((car) => (
          <div key={car.id} className={CARD_W}>
            <BuyerCarCard car={car} />
          </div>
        ))}
      </div>
    </div>
  );
}
