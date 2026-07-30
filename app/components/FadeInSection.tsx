"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** When true, applies stagger-children and toggles is-visible on enter */
  stagger?: boolean;
};

export default function FadeInSection({ children, className = "", delay = 0, stagger = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }

    const alreadyInView = () => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight + 120 && rect.bottom > -80;
    };
    if (alreadyInView()) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: "80px 0px 80px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (stagger) {
    return (
      <div
        ref={ref}
        className={`stagger-children ${visible ? "is-visible" : ""} ${className}`}
        style={delay ? ({ "--stagger-base": `${delay}ms` } as CSSProperties) : undefined}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
