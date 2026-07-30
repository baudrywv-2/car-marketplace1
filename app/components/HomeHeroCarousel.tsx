"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Cinematic alpine/open-landscape heroes. Cars sit in the lower third
 * (Porsche reference). Mobile uses a slightly higher crop so more sky/car
 * survives the taller first viewport.
 */
const HERO_SLIDES = [
  {
    src: "/hero/hero-porsche-v2.jpg",
    alt: "Porsche",
    position: "object-[center_68%] sm:object-[center_75%]",
  },
  {
    src: "/hero/hero-gwagon-v9.jpg",
    alt: "Mercedes-Benz G-Wagon",
    position: "object-[center_65%] sm:object-[center_72%]",
  },
  {
    src: "/hero/hero-toyota-v3.jpg",
    alt: "Toyota Vanguard / RAV4",
    position: "object-[center_70%] sm:object-[center_78%]",
  },
];

type Props = {
  className?: string;
};

export default function HomeHeroCarousel({ className = "" }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-black ${className}`}
      aria-hidden
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className={`object-cover ${slide.position}`}
            sizes="100vw"
            priority={i === 0}
            fetchPriority={i === 0 ? "high" : "auto"}
          />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/85" />

      {/* Dots at top — clear of search/CTAs; large hit targets, slim visual pills */}
      <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-0.5 sm:top-4">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={slide.alt}
            aria-current={i === index ? "true" : undefined}
            onClick={() => setIndex(i)}
            className="flex h-11 w-11 items-center justify-center"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-7 bg-[var(--accent)]" : "w-2.5 bg-white/50"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
