"use client";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";

export function Gallery({ photos }: { photos: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () => setOpenIndex((i) => (i == null ? i : (i + photos.length - 1) % photos.length)),
    [photos.length]
  );
  const next = useCallback(
    () => setOpenIndex((i) => (i == null ? i : (i + 1) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (openIndex == null) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, prev, next]);

  if (!photos?.length) {
    return (
      <div className="rounded-xl border border-black/10 dark:border-white/15 p-6 text-center text-sm text-black/70 dark:text-white/70">
        No photos yet. Add images to <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">public/photos</code>
        {" "}
        (.jpg, .png, .webp, .avif) and refresh.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((src, i) => (
          <button
            key={src}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-black/[0.04] dark:bg-white/[0.06]"
            onClick={() => setOpenIndex(i)}
            aria-label={`Open image ${i + 1}`}
          >
            <Image
              src={src}
              alt="Artwork"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              priority={i < 4}
            />
          </button>
        ))}
      </div>

      {openIndex != null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
          role="dialog"
          aria-modal
        >
          <div className="relative w-full max-w-6xl aspect-[16/10]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={photos[openIndex]}
              alt={`Artwork ${openIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
            <button
              className="absolute top-3 right-3 bg-white/90 text-black rounded-full h-9 w-9 grid place-items-center hover:bg-white"
              onClick={close}
              aria-label="Close"
            >
              ×
            </button>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 text-black rounded-full h-10 w-10 grid place-items-center hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 text-black rounded-full h-10 w-10 grid place-items-center hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next image"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </>
  );
}

