"use client";

import Link from "next/link";
import { useLocale } from "@/app/contexts/LocaleContext";
import SubtleScrollRail from "@/app/components/SubtleScrollRail";

/** Local showcase photos — labels match the actual cars in each file. */
const SHOWCASE = [
  {
    make: "Toyota",
    model: "Land Cruiser",
    price: "From $28,000",
    img: "/showcase/land-cruiser.jpg",
    specs: [
      { labelKey: "year" as const, value: "2020" },
      { labelKey: "condition" as const, valueKey: "used" as const },
      { labelKey: "shopByFuel" as const, valueKey: "diesel" as const },
    ],
  },
  {
    make: "Mercedes-Benz",
    model: "G-Class",
    price: "From $95,000",
    img: "/showcase/g-class.jpg",
    specs: [
      { labelKey: "year" as const, value: "2022" },
      { labelKey: "condition" as const, valueKey: "used" as const },
      { labelKey: "shopByTransmission" as const, valueKey: "automatic" as const },
    ],
  },
  {
    make: "BMW",
    model: "X5",
    price: "From $42,000",
    img: "/showcase/bmw-x5.jpg",
    specs: [
      { labelKey: "year" as const, value: "2021" },
      { labelKey: "condition" as const, valueKey: "used" as const },
      { labelKey: "location" as const, value: "Kinshasa" },
    ],
  },
  {
    make: "Porsche",
    model: "911",
    price: "From $78,000",
    img: "/showcase/porsche.jpg",
    specs: [
      { labelKey: "year" as const, value: "2019" },
      { labelKey: "condition" as const, valueKey: "used" as const },
      { labelKey: "shopByFuel" as const, valueKey: "essence" as const },
    ],
  },
  {
    make: "Honda",
    model: "CR-V",
    price: "From $22,000",
    img: "/showcase/cr-v.jpg",
    specs: [
      { labelKey: "year" as const, value: "2020" },
      { labelKey: "condition" as const, valueKey: "used" as const },
      { labelKey: "shopByTransmission" as const, valueKey: "automatic" as const },
    ],
  },
  {
    make: "Ford",
    model: "Ranger",
    price: "From $26,000",
    img: "/showcase/ranger.jpg",
    specs: [
      { labelKey: "year" as const, value: "2019" },
      { labelKey: "condition" as const, valueKey: "used" as const },
      { labelKey: "shopByFuel" as const, valueKey: "diesel" as const },
    ],
  },
  {
    make: "Land Rover",
    model: "Defender",
    price: "From $68,000",
    img: "/showcase/defender.jpg",
    specs: [
      { labelKey: "year" as const, value: "2022" },
      { labelKey: "condition" as const, valueKey: "used" as const },
      { labelKey: "location" as const, value: "Goma" },
    ],
  },
  {
    make: "Toyota",
    model: "RAV4",
    price: "From $18,500",
    img: "/showcase/rav4.jpg",
    specs: [
      { labelKey: "year" as const, value: "2021" },
      { labelKey: "condition" as const, valueKey: "used" as const },
      { labelKey: "location" as const, value: "Lubumbashi" },
    ],
  },
];

const cardWidth =
  "w-[min(72vw,210px)] shrink-0 overflow-hidden bg-black snap-start sm:w-[180px] md:w-[190px] lg:w-[200px] xl:w-[210px]";

/** Visual stand-ins when the marketplace has no approved listings yet */
export default function HomeShowcasePlaceholders() {
  const { t } = useLocale();

  return (
    <div className="relative">
      <p className="mb-3.5 text-xs text-white/50">
        {t("noListings")}{" "}
        <Link
          href="/dashboard/cars/new"
          className="inline-flex min-h-10 items-center text-[var(--accent)] hover:underline"
        >
          {t("listYourCar")}
        </Link>
      </p>
      <SubtleScrollRail variant="cards" stepRatio={0.78} className="snap-x snap-mandatory gap-3 pb-1 px-2 sm:px-3">
        {SHOWCASE.map((item) => (
          <Link key={`${item.make}-${item.model}`} href="/dashboard/cars/new" className={cardWidth}>
            <div className="relative aspect-[4/3] overflow-hidden bg-[#111]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.img}
                alt={`${item.make} ${item.model}`}
                className="h-full w-full object-cover object-center"
                loading="lazy"
              />
            </div>
            <div className="border-t border-[var(--accent)]/35 bg-black px-2.5 pb-2.5 pt-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
                {item.make}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold uppercase tracking-wide text-white line-clamp-1">
                {item.model}
              </p>
              <p className="mt-1.5 text-[15px] font-semibold tabular-nums text-[var(--accent)]">
                {item.price}
              </p>
              <dl className="mt-2 border-t border-white/10">
                {item.specs.map((row) => (
                  <div
                    key={row.labelKey}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-2 border-b border-white/10 last:border-b-0"
                  >
                    <dt className="py-1.5 text-[10px] text-[var(--accent)]/80">{t(row.labelKey)}</dt>
                    <dd className="py-1.5 text-right text-[10px] font-medium text-white/90">
                      {"value" in row && row.value
                        ? row.value
                        : "valueKey" in row && row.valueKey
                          ? t(row.valueKey)
                          : ""}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Link>
        ))}
      </SubtleScrollRail>
    </div>
  );
}
