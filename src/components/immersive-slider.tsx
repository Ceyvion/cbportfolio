"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type Slide = {
  src: string;
  title: string;
  subtitle: string;
};

export function ImmersiveSlider({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const [smoothActive, setSmoothActive] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const [introReady, setIntroReady] = useState(false);

  useEffect(() => {
    setIntroReady(false);
    const id = requestAnimationFrame(() => setIntroReady(true));
    return () => cancelAnimationFrame(id);
  }, [slides.length]);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = itemRefs.current.slice();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = Number((visible.target as HTMLElement).dataset.index || 0);
          setActive(idx);
        }
      },
      { root: containerRef.current, threshold: [0.25, 0.5, 0.75] }
    );
    items.forEach((el) => el && observer.observe(el));
    return () => {
      items.forEach((el) => el && observer.unobserve(el));
      observer.disconnect();
    };
  }, [slides.length]);

  useEffect(() => {
    let raf: number | null = null;
    const animate = () => {
      setSmoothActive((prev) => {
        const delta = active - prev;
        if (Math.abs(delta) < 0.001) return prev;
        return prev + delta * 0.12;
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [active]);

  if (slides.length === 0) {
    return (
      <section className="relative flex min-h-screen items-center justify-center px-6 text-center text-sm text-white/70 bg-[#0b0d12]">
        <div className="rounded-[38px] border border-white/10 bg-white/5 px-6 py-10">
          No images yet. Add files to <code className="rounded bg-white/10 px-1">public/photos</code> and refresh to light up this view.
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-screen overflow-hidden bg-[#0b0d12] text-white">
      <div className="pointer-events-none fixed top-5 left-6 z-30 text-[11px] font-medium uppercase tracking-[0.24em] text-white/60">
        Still wing
      </div>
      <div className="pointer-events-none fixed top-5 right-6 z-30 text-[11px] font-medium uppercase tracking-[0.24em] text-white/60">
        {slides.length} frames
      </div>

      <div
        ref={containerRef}
        className="relative h-full overflow-y-auto snap-y snap-mandatory"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(900px_900px_at_30%_20%,rgba(255,255,255,0.08),transparent_60%),radial-gradient(1200px_1100px_at_70%_-10%,rgba(71,149,132,0.22),transparent_60%),radial-gradient(1000px_1000px_at_40%_90%,rgba(120,126,241,0.18),transparent_60%)]" />

        <div className="relative flex flex-col">
          {slides.map((slide, idx) => {
            const distance = Math.abs(idx - smoothActive);
            const scale = 1 - Math.min(0.06 * distance, 0.14);
            const baseOpacity = 1 - Math.min(0.16 * distance, 0.4);
            const slideOpacity = introReady ? baseOpacity : 0;
            const translateY = distance * 8 + (introReady ? 0 : 14);
            const textOpacity = (introReady ? 1 : 0) * (1 - Math.min(0.35 * distance, 0.7));
            const textTranslate = 12 + distance * 6 + (introReady ? 0 : 10);
            const transitionDelay = introReady ? `${Math.min(idx, 10) * 24}ms` : "0ms";

            return (
              <article
                key={`${slide.src}-${idx}`}
                data-index={idx}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                className="relative min-h-screen snap-start"
                style={{
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  opacity: slideOpacity,
                  transition: "transform 900ms cubic-bezier(.22,.61,.36,1), opacity 900ms ease",
                  transitionDelay,
                  willChange: "transform, opacity",
                }}
              >
                <Image
                  src={slide.src}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={idx < 2}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-end gap-3 px-6 pb-14 sm:px-10 sm:pb-16">
                <h2
                    className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
                    style={{
                      opacity: textOpacity,
                      transform: `translateY(${textTranslate}px)`,
                      transition: "opacity 900ms ease, transform 900ms cubic-bezier(.22,.61,.36,1)",
                    }}
                  >
                    {slide.title}
                  </h2>
                  <p
                    className="text-sm sm:text-base text-white/85 font-light drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                    style={{
                      opacity: Math.max(0, textOpacity - 0.05),
                      transform: `translateY(${textTranslate + 6}px)`,
                      transition: "opacity 900ms ease, transform 900ms cubic-bezier(.22,.61,.36,1)",
                    }}
                  >
                    {slide.subtitle}
                  </p>
                  <span
                    className="text-xs font-medium uppercase tracking-[0.2em] text-white/70"
                    style={{
                      opacity: Math.max(0, textOpacity - 0.1),
                      transform: `translateY(${textTranslate + 10}px)`,
                      transition: "opacity 900ms ease, transform 900ms cubic-bezier(.22,.61,.36,1)",
                    }}
                  >
                    {idx + 1} / {slides.length}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
