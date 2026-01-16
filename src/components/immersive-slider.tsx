"use client";
import Image from "next/image";
import { siteConfig } from "@/lib/site";
import { formatAltFromSrc } from "@/lib/alt";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

export type Slide = {
  src: string;
  title: string;
  subtitle: string;
  mediaType?: "image" | "video";
  poster?: string;
};

function VideoSlide({
  src,
  poster,
  shouldPlay,
  className,
  style,
  ariaLabel,
}: {
  src: string;
  poster?: string;
  shouldPlay: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!shouldPlay || document.visibilityState !== "visible") {
      el.pause();
      return;
    }
    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }, [shouldPlay]);

  useEffect(() => {
    const onVisibility = () => {
      const el = ref.current;
      if (!el) return;
      if (document.visibilityState !== "visible") {
        el.pause();
      } else if (shouldPlay) {
        const playPromise = el.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [shouldPlay]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      className={className}
      style={style}
      aria-label={ariaLabel}
      playsInline
      muted
      loop
      autoPlay={shouldPlay}
      preload={shouldPlay ? "auto" : "metadata"}
    />
  );
}

export function ImmersiveSlider({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const [smoothActive, setSmoothActive] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollTargetRef = useRef(0);
  const smoothActiveRef = useRef(0);
  const smoothRafRef = useRef<number | null>(null);
  const viewportHeightRef = useRef(1);
  const [viewportHeight, setViewportHeight] = useState(1);
  const [introReady, setIntroReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const predecoded = useRef<Set<string>>(new Set());
  useEffect(() => {
    smoothActiveRef.current = smoothActive;
  }, [smoothActive]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
    } else {
      media.addListener(update);
    }
    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", update);
      } else {
        media.removeListener(update);
      }
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setIntroReady(true);
      return;
    }
    setIntroReady(false);
    const id = requestAnimationFrame(() => setIntroReady(true));
    return () => cancelAnimationFrame(id);
  }, [slides.length, reduceMotion]);

  const startSmooth = useCallback(() => {
    if (reduceMotion || smoothRafRef.current !== null) return;
    const step = () => {
      const maxIndex = Math.max(0, slides.length - 1);
      const target = Math.min(Math.max(scrollTargetRef.current, 0), maxIndex);
      const prev = smoothActiveRef.current;
      const delta = target - prev;
      if (Math.abs(delta) < 0.001) {
        smoothActiveRef.current = target;
        setSmoothActive(target);
        smoothRafRef.current = null;
        return;
      }
      const next = prev + delta * 0.14;
      smoothActiveRef.current = next;
      setSmoothActive(next);
      smoothRafRef.current = requestAnimationFrame(step);
    };

    smoothRafRef.current = requestAnimationFrame(step);
  }, [reduceMotion, slides.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxIndex = Math.max(0, slides.length - 1);

    const measureHeight = () => {
      const nextHeight = el.clientHeight || 1;
      viewportHeightRef.current = nextHeight;
      setViewportHeight(nextHeight);
    };

    const updateFromScroll = () => {
      const height = viewportHeightRef.current || 1;
      const target = Math.min(maxIndex, Math.max(0, el.scrollTop / height));
      scrollTargetRef.current = target;
      const nextActive = Math.round(target);
      setActive((prev) => (prev === nextActive ? prev : nextActive));
      startSmooth();
    };

    const handleResize = () => {
      measureHeight();
      updateFromScroll();
    };

    measureHeight();
    updateFromScroll();
    el.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(handleResize)
        : null;
    resizeObserver?.observe(el);
    return () => {
      el.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      resizeObserver?.disconnect();
    };
  }, [slides.length, startSmooth]);

  useEffect(() => {
    if (reduceMotion) {
      if (smoothRafRef.current !== null) {
        cancelAnimationFrame(smoothRafRef.current);
        smoothRafRef.current = null;
      }
      smoothActiveRef.current = active;
      setSmoothActive(active);
      return;
    }
    startSmooth();
  }, [reduceMotion, active, startSmooth]);

  useEffect(() => {
    return () => {
      if (smoothRafRef.current !== null) {
        cancelAnimationFrame(smoothRafRef.current);
      }
    };
  }, []);

  // Preload and decode nearby images to avoid jank when they enter view
  useEffect(() => {
    if (typeof window === "undefined") return;
    const targets = [active - 1, active, active + 1, active + 2].filter(
      (i) => i >= 0 && i < slides.length
    );
    targets.forEach((i) => {
      const slide = slides[i];
      if (!slide || slide.mediaType === "video") return;
      if (predecoded.current.has(slide.src)) return;
      const img = new window.Image();
      img.decoding = "async";
      img.src = slide.src;
      const markDone = () => predecoded.current.add(slide.src);
      img.onload = markDone;
      img.onerror = markDone;
      if (typeof img.decode === "function") {
        img.decode().then(markDone).catch(markDone);
      }
    });
  }, [active, slides]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = containerRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(slides.length - 1, index));
      const height = el.clientHeight || viewportHeightRef.current || 1;
      el.scrollTo({ top: clamped * height, behavior: reduceMotion ? "auto" : "smooth" });
    },
    [reduceMotion, slides.length]
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === "ArrowDown" || key === "PageDown") {
        e.preventDefault();
        scrollToIndex(active + 1);
      }
      if (key === "ArrowUp" || key === "PageUp") {
        e.preventDefault();
        scrollToIndex(active - 1);
      }
      if (key === "Home") {
        e.preventDefault();
        scrollToIndex(0);
      }
      if (key === "End") {
        e.preventDefault();
        scrollToIndex(slides.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, scrollToIndex, slides.length]);

  const editorialFooter = (
    <div
      className={`fixed inset-x-0 bottom-6 z-30 flex justify-center px-6 transition duration-700 ease-out ${
        introReady ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex w-[min(980px,100%)] flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-white/55">
          In the margins
        </p>
        <p className="font-[var(--font-display)] text-lg uppercase leading-tight text-white/85 drop-shadow-[0_10px_30px_rgba(0,0,0,0.65)] sm:text-2xl">
          For the full cut, connect on{" "}
          <a
            href={siteConfig.instagram}
            target="_blank"
            rel="noreferrer noopener"
            className="text-white/95 underline decoration-[color:var(--accent)] decoration-2 underline-offset-4 transition hover:text-white"
          >
            Instagram
          </a>
          .
        </p>
      </div>
    </div>
  );

  if (slides.length === 0) {
    return (
      <section className="relative flex h-screen min-h-[100dvh] items-center justify-center bg-[#05060b] px-6 text-center text-sm text-white/70">
        {editorialFooter}
        <div className="rounded-[38px] border border-white/15 bg-white/5 px-6 py-10 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
          No images yet. Add files to <code className="rounded bg-white/10 px-1">public/photos</code> and refresh to light up this view.
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Immersive slider"
      className="relative h-screen min-h-[100dvh] overflow-hidden bg-[#05060b] text-white"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(900px_900px_at_12%_20%,rgba(49,246,255,0.22),transparent_60%),radial-gradient(1000px_1000px_at_90%_10%,rgba(255,90,31,0.18),transparent_60%),radial-gradient(800px_800px_at_50%_90%,rgba(199,255,74,0.14),transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.06),rgba(255,255,255,0.06)_1px,transparent_1px,transparent_7px)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-t from-black/70 via-black/35 to-transparent"
        aria-hidden
      />
      {editorialFooter}

      <div
        ref={containerRef}
        className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory overscroll-contain"
        style={{ scrollBehavior: reduceMotion ? "auto" : "smooth" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(820px_820px_at_32%_20%,rgba(49,246,255,0.12),transparent_60%),radial-gradient(900px_900px_at_70%_-10%,rgba(255,90,31,0.12),transparent_60%),radial-gradient(700px_700px_at_46%_90%,rgba(199,255,74,0.1),transparent_60%)]" />

        {(() => {
          const windowRadius = 3;
          const windowStart = Math.max(0, active - windowRadius);
          const windowEnd = Math.min(slides.length - 1, active + windowRadius);
          const topPadding = windowStart * viewportHeight;
          const bottomPadding = Math.max(0, slides.length - windowEnd - 1) * viewportHeight;

          return (
            <div
              className="relative flex flex-col"
              style={{ paddingTop: topPadding, paddingBottom: bottomPadding }}
            >
              {slides.slice(windowStart, windowEnd + 1).map((slide, offset) => {
                const idx = windowStart + offset;
                const motionSafe = !reduceMotion;
                const effectiveActive = motionSafe ? smoothActive : active;
                const distance = Math.abs(idx - effectiveActive);
                const eased = distance < 0.001 ? 0 : distance;
                const baseOpacity = motionSafe ? 1 - Math.min(0.12 * eased, 0.35) : 1;
                const slideOpacity = introReady ? baseOpacity : 0;
                const translateY = motionSafe ? (introReady ? 0 : 14) + eased * 4 : 0;
                const transitionDelay = motionSafe && introReady ? `${Math.min(idx, 10) * 24}ms` : "0ms";
                const shouldPlay = slide.mediaType === "video" && !reduceMotion && Math.abs(idx - active) <= 1;
                const mediaLabel = slide.title || "Image capture";
                const altText =
                  slide.mediaType === "video" ? "" : slide.title ? slide.title : formatAltFromSrc(slide.src);

                return (
                  <article
                    key={`${slide.src}-${idx}`}
                    data-index={idx}
                    className="relative h-screen min-h-[100dvh] snap-start"
                    style={{
                      transform: `translateY(${translateY}px)`,
                      opacity: slideOpacity,
                      transition: motionSafe
                        ? "transform 900ms cubic-bezier(.22,.61,.36,1), opacity 900ms ease"
                        : "none",
                      transitionDelay,
                      willChange: "transform, opacity",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "translateZ(0)",
                        WebkitTransform: "translateZ(0)",
                      }}
                    >
                      {slide.mediaType === "video" ? (
                        <VideoSlide
                          src={slide.src}
                          poster={slide.poster}
                          shouldPlay={shouldPlay}
                          ariaLabel={mediaLabel}
                          className="h-full w-full object-cover"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                          }}
                        />
                      ) : (
                        <Image
                          src={slide.src}
                          alt={altText}
                          fill
                          sizes="100vw"
                          className="object-cover"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                          }}
                          priority={idx === 0}
                          fetchPriority={idx === 0 ? "high" : "auto"}
                        />
                      )}
                    </div>
                    <div
                      className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(600px_420px_at_20%_20%,rgba(49,246,255,0.24),transparent_62%),radial-gradient(600px_420px_at_85%_15%,rgba(255,90,31,0.2),transparent_65%)] opacity-70 mix-blend-screen"
                      aria-hidden
                    />

                  </article>
                );
              })}
            </div>
          );
        })()}
      </div>
    </section>
  );
}
