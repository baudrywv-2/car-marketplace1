"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Mobile: one static dark premium G-Wagon — no dots, no auto-rotate.
 * Desktop: quiet ambient crossfade for atmosphere only (no controls).
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

/** Darker premium frame for mobile overlay only */
const MOBILE_HERO = {
  src: "/hero/hero-gwagon-mobile-dark.jpg",
  alt: "Mercedes-Benz G-Wagon",
  position: "object-[center_48%]",
};

type Props = {
  className?: string;
};

function useIsDesktopHero() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return desktop;
}

export default function HomeHeroCarousel({ className = "" }: Props) {
  const isDesktop = useIsDesktopHero();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!isDesktop || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [isDesktop, paused]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-black ${className}`}
      aria-hidden
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Mobile: single static image */}
      <div className="absolute inset-0 sm:hidden">
        <Image
          src={MOBILE_HERO.src}
          alt={MOBILE_HERO.alt}
          fill
          className={`object-cover ${MOBILE_HERO.position}`}
          sizes="100vw"
          priority
          fetchPriority="high"
        />
      </div>

      {/* Desktop: ambient crossfade — no dots / arrows */}
      <div className="absolute inset-0 hidden sm:block">
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-[1600ms] ease-out ${
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
      </div>

      {/* Mobile: soft vignette + readable veil; desktop cinematic depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70 sm:from-black/45 sm:via-black/10 sm:to-black/85" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.55)_100%)] sm:hidden" />
    </div>
  );
}
