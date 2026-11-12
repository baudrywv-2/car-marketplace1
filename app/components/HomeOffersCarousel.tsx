"use client";

import { useState } from "react";
import BuyerCarCard, { type BuyerCarCardData } from "@/app/components/BuyerCarCard";
import CarCardSkeleton from "@/app/components/CarCardSkeleton";
import SubtleScrollRail from "@/app/components/SubtleScrollRail";
import { useLocale } from "@/app/contexts/LocaleContext";

type Props = {
  cars: BuyerCarCardData[];
  loading?: boolean;
  autoPlay?: boolean;
};

const CARD_W =
  "w-[min(34vw,108px)] shrink-0 snap-start sm:w-[148px] md:w-[160px] lg:w-[172px] xl:w-[180px]";

export default function HomeOffersCarousel({ cars, loading, autoPlay = true }: Props) {
  const { t } = useLocale();
  const [paused, setPaused] = useState(false);

  if (loading) {
    return (
      <div className="flex gap-1 overflow-hidden sm:gap-2" aria-label={t("featuredLoading")}>
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
      <SubtleScrollRail
        variant="cards"
        stepRatio={0.78}
        autoPlayMs={autoPlay && cars.length > 1 ? 5000 : undefined}
        paused={paused}
        onUserScroll={() => setPaused(true)}
        className="snap-x snap-mandatory gap-1 pb-0.5 px-1 sm:gap-2 sm:px-2"
      >
        {cars.map((car, i) => (
          <div key={car.id} className={CARD_W}>
            <BuyerCarCard car={car} compact priority={i < 2} />
          </div>
        ))}
      </SubtleScrollRail>
    </div>
  );
}
