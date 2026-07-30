"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Cars sit in the lower third of each photo.
 * Mobile: bias crop toward the car (bottom). Desktop keeps cinematic framing.
 */
const HERO_SLIDES = [
  {
    src: "/hero/hero-porsche-v2.jpg",
    alt: "Porsche",
    position: "object-[center_82%] sm:object-[center_75%]",
  },
  {
    src: "/hero/hero-gwagon-v9.jpg",
    alt: "Mercedes-Benz G-Wagon",
    position: "object-[center_78%] sm:object-[center_72%]",
  },
  {
    src: "/hero/hero-toyota-v3.jpg",
    alt: "Toyota Vanguard / RAV4",
    position: "object-[center_85%] sm:object-[center_78%]",
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
      {/* Lighter mobile gradient — cars must stay readable; desktop keeps depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/50 sm:from-black/45 sm:via-black/10 sm:to-black/85" />

      {/* Dots: bottom of image on mobile (clear of copy); top on desktop */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 sm:bottom-auto sm:top-4">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={slide.alt}
            aria-current={i === index ? "true" : undefined}
            onClick={() => setIndex(i)}
            className="flex h-10 w-10 items-center justify-center sm:h-11 sm:w-11"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-7 bg-[var(--accent)]" : "w-2.5 bg-white/55"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
