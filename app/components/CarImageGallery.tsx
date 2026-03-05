"use client";

import { useState } from "react";
import OptimizedCarImage from "./OptimizedCarImage";
import CarImagePlaceholder from "./CarImagePlaceholder";

type Props = {
  images: string[];
  title: string;
};

export default function CarImageGallery({ images, title }: Props) {
  const [active, setActive] = useState(0);
  const list = images?.filter(Boolean) ?? [];

  if (list.length === 0) {
    return <CarImagePlaceholder className="aspect-video w-full min-h-[120px]" />;
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-[var(--radius)] bg-[var(--border)]">
        <OptimizedCarImage
          src={list[active]}
          alt={`${title} – image ${active + 1}`}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((a) => (a === 0 ? list.length - 1 : a - 1))}
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
              aria-label="Previous image"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setActive((a) => (a === list.length - 1 ? 0 : a + 1))}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
              aria-label="Next image"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
              {active + 1} / {list.length}
            </span>
          </>
        )}
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-[var(--radius)] border-2 transition ${
                i === active ? "border-[var(--accent)]" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
