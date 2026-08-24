"use client";

import Image from "next/image";
import { formatAltFromSrc } from "@/lib/alt";
import { siteConfig } from "@/lib/site";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";

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
  const [mediaReady, setMediaReady] = useState(false);

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
    <div className={className} style={style}>
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden
          className="object-cover"
        />
      ) : null}
      <video
        ref={ref}
        src={src}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ease-out ${
          mediaReady && shouldPlay ? "opacity-100" : "opacity-0"
        }`}
        aria-label={ariaLabel}
        playsInline
        muted
        loop
        autoPlay={shouldPlay}
        preload="metadata"
        onTimeUpdate={(event) => {
          const currentTime = event.currentTarget.currentTime;
          if (mediaReady && currentTime < 0.25) setMediaReady(false);
          if (!mediaReady && currentTime >= 1) setMediaReady(true);
        }}
      />
    </div>
  );
}

export function ImmersiveSlider({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);

  useEffect(() => {
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
    const el = containerRef.current;
    if (!el) return;
    const maxIndex = Math.max(0, slides.length - 1);

    const updateActive = () => {
      scrollRafRef.current = null;
      const height = el.clientHeight || 1;
      const nextActive = Math.min(maxIndex, Math.max(0, Math.round(el.scrollTop / height)));
      if (nextActive === activeRef.current) return;
      activeRef.current = nextActive;
      setActive(nextActive);
    };

    const onScroll = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = requestAnimationFrame(updateActive);
    };

    const handleResize = () => updateActive();

    updateActive();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      resizeObserver?.disconnect();
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [slides.length]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = containerRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(slides.length - 1, index));
      const height = el.clientHeight || 1;
      el.scrollTo({
        top: clamped * height,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    },
    [reduceMotion, slides.length]
  );

  const navigateToIndex = useCallback(
    (index: number) => {
      scrollToIndex(index);
      requestAnimationFrame(() => containerRef.current?.focus({ preventScroll: true }));
    },
    [scrollToIndex]
  );

  const onSliderKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        scrollToIndex(active + 1);
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        scrollToIndex(active - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        scrollToIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        scrollToIndex(slides.length - 1);
      }
    },
    [active, scrollToIndex, slides.length]
  );

  const topNavigation = (
    <header
      className="fixed inset-x-0 z-40 flex items-center justify-between px-4 sm:px-6"
      style={{ top: "max(1rem, env(safe-area-inset-top))" }}
    >
      <h1 className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/80 sm:text-xs">
        <span className="sr-only">CB Portfolio</span>
        <span aria-hidden>Welcome</span>
      </h1>
      <div className="flex items-center gap-2">
        <span className="mr-1 text-[10px] font-semibold tabular-nums tracking-[0.2em] text-white/55">
          {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => navigateToIndex(active - 1)}
          disabled={active === 0}
          aria-label="Previous frame"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/35 text-lg text-white transition-[transform,border-color,background-color,opacity] duration-150 ease-out hover:border-white/45 hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.96] disabled:cursor-default disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => navigateToIndex(active + 1)}
          disabled={active === slides.length - 1}
          aria-label="Next frame"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/35 text-lg text-white transition-[transform,border-color,background-color,opacity] duration-150 ease-out hover:border-white/45 hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.96] disabled:cursor-default disabled:opacity-30"
        >
          ↓
        </button>
      </div>
    </header>
  );

  const editorialFooter = (
    <footer
      className="fixed inset-x-0 z-40 flex justify-center px-4 sm:px-6"
      style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex w-[min(980px,100%)] justify-end">
        <a
          href={siteConfig.instagram}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="View CB Portfolio on Instagram"
          className="group grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/35 text-white transition-[transform,border-color,background-color,color] duration-150 ease-out hover:border-[color:var(--accent)]/70 hover:bg-black/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.96]"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="transition-transform duration-150 ease-out group-hover:scale-105"
          >
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
            <circle cx="12" cy="12" r="3.75" />
            <circle cx="17.4" cy="6.75" r="0.8" fill="currentColor" stroke="none" />
          </svg>
        </a>
      </div>
    </footer>
  );

  if (slides.length === 0) {
    return (
      <section className="relative flex h-screen min-h-[100dvh] items-center justify-center bg-[#05060b] px-6 text-center text-sm text-white/70">
        <div className="rounded-[38px] border border-white/15 bg-white/5 px-6 py-10 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          No images yet. Add files to{" "}
          <code className="rounded bg-white/10 px-1">public/photos</code> and refresh.
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
        className="pointer-events-none fixed inset-0 z-20 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(700px 540px at 14% 14%, rgba(49,246,255,0.22), transparent 62%), radial-gradient(760px 520px at 88% 12%, rgba(255,90,31,0.18), transparent 64%), repeating-linear-gradient(0deg, rgba(255,255,255,0.025), rgba(255,255,255,0.025) 1px, transparent 1px, transparent 8px)",
          mixBlendMode: "screen",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-30 bg-gradient-to-t from-black/80 via-transparent to-black/40"
        aria-hidden
      />
      {topNavigation}
      {editorialFooter}

      <div
        ref={containerRef}
        role="group"
        aria-roledescription="carousel"
        aria-label={`Portfolio frames. Frame ${active + 1} of ${slides.length}.`}
        tabIndex={0}
        onKeyDown={onSliderKeyDown}
        className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent)]"
      >
        {slides.map((slide, index) => {
          const shouldPlay = slide.mediaType === "video" && !reduceMotion && index === active;
          const altText =
            slide.mediaType === "video" ? "" : slide.title || formatAltFromSrc(slide.src);

          return (
            <article
              key={`${slide.src}-${index}`}
              data-index={index}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}: ${slide.title}`}
              aria-current={index === active ? "true" : undefined}
              aria-hidden={index === active ? undefined : true}
              className="relative h-screen min-h-[100dvh] snap-start bg-[#07080d]"
              style={{
                contain: "layout paint style",
                contentVisibility: "auto",
                containIntrinsicSize: "100dvh",
              }}
            >
              {slide.mediaType === "video" ? (
                <VideoSlide
                  src={slide.src}
                  poster={slide.poster}
                  shouldPlay={shouldPlay}
                  ariaLabel={slide.title || "Portfolio film"}
                  className="absolute inset-0 overflow-hidden"
                />
              ) : (
                <div className="absolute inset-x-4 bottom-20 top-16 sm:inset-x-10 sm:bottom-16 sm:top-20">
                  <Image
                    src={slide.src}
                    alt={altText}
                    fill
                    sizes="(max-width: 640px) calc(100vw - 2rem), calc(100vw - 5rem)"
                    className="object-contain drop-shadow-[0_30px_70px_rgba(0,0,0,0.48)]"
                    priority={index === 0}
                    loading={index === 0 ? undefined : index <= active + 1 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    draggable={false}
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
