"use client";
import Image from "next/image";
import { siteConfig } from "@/lib/site";
import { formatAltFromSrc } from "@/lib/alt";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const rootRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollTargetRef = useRef(0);
  const viewportHeightRef = useRef(1);
  const [viewportHeight, setViewportHeight] = useState(1);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const [introReady, setIntroReady] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const predecoded = useRef<Set<string>>(new Set());
  const { videoCount, photoCount } = useMemo(() => {
    const videos = slides.filter((slide) => slide.mediaType === "video").length;
    return { videoCount: videos, photoCount: Math.max(0, slides.length - videos) };
  }, [slides]);

  useEffect(() => {
    if (!aboutOpen && !projectsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAboutOpen(false);
        setProjectsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aboutOpen, projectsOpen]);

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
  }, [slides.length]);

  useEffect(() => {
    if (reduceMotion) {
      setSmoothActive(active);
    }
  }, [reduceMotion, active]);

  useEffect(() => {
    if (reduceMotion) return;
    let raf: number | null = null;
    const animate = () => {
      setSmoothActive((prev) => {
        const target = Math.min(Math.max(scrollTargetRef.current, 0), Math.max(0, slides.length - 1));
        const delta = target - prev;
        if (Math.abs(delta) < 0.001) return target;
        return prev + delta * 0.14;
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [slides.length, reduceMotion]);

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

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    handleChange();
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const projects = [
    {
      name: "Canyon Arts Council",
      type: "Cultural nonprofit",
      outcome: "Identity refresh + fundraising microsite",
    },
    {
      name: "Sable Ridge",
      type: "Hospitality client",
      outcome: "Launch site + booking flow",
    },
    {
      name: "Arc Atelier",
      type: "Studio collaboration",
      outcome: "Editorial system + studio lookbook",
    },
  ];

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
  const safeTop = "calc(env(safe-area-inset-top, 0px) + 20px)";
  const safeTopPanel = "calc(env(safe-area-inset-top, 0px) + 78px)";
  const safeTopHero = "calc(env(safe-area-inset-top, 0px) + 84px)";
  const progress = slides.length > 1 ? active / (slides.length - 1) : 0;
  const progressPercent = Math.min(100, Math.max(0, progress * 100));
  const chromeButton =
    "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.99]";
  const heroPrimary =
    "inline-flex items-center gap-2 rounded-full border border-white/20 bg-[linear-gradient(120deg,rgba(49,246,255,0.3),rgba(255,90,31,0.4))] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md transition hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black";
  const heroSecondary =
    "inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;
    const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
    const el =
      (rootRef.current as (HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }) | null) ??
      (doc.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void });

    try {
      if (doc.fullscreenElement) {
        if (typeof doc.exitFullscreen === "function") await doc.exitFullscreen();
        else if (typeof doc.webkitExitFullscreen === "function") await doc.webkitExitFullscreen();
      } else if (el) {
        if (typeof el.requestFullscreen === "function") await el.requestFullscreen();
        else if (typeof el.webkitRequestFullscreen === "function") await el.webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn("Unable to toggle fullscreen", err);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if (aboutOpen || projectsOpen) return;
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
  }, [toggleFullscreen, aboutOpen, projectsOpen, active, scrollToIndex, slides.length]);

  const topChrome = (
    <>
      <div
        className={`fixed left-1/2 z-40 flex w-[min(1240px,calc(100%-24px))] -translate-x-1/2 items-center justify-between gap-3 px-3 transition duration-700 ease-out sm:px-6 ${
          introReady ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
        style={{ top: safeTop }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-white/70">
            <span
              className="h-2 w-2 rounded-full bg-[radial-gradient(circle,#31f6ff,transparent_65%)] shadow-[0_0_14px_rgba(49,246,255,0.7)]"
              aria-hidden
            />
            Live set
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.36em] text-white/60">
            CB Studio
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setProjectsOpen((v) => !v);
              setAboutOpen(false);
            }}
            className={chromeButton}
            aria-expanded={projectsOpen}
            aria-controls="projects-panel"
          >
            Projects
            <span className="text-base leading-none">{projectsOpen ? "–" : "+"}</span>
          </button>
          <a
            href={siteConfig.instagram}
            target="_blank"
            rel="noreferrer noopener"
            className={`${chromeButton} hidden sm:inline-flex`}
          >
            <span className="h-2 w-2 rounded-full bg-[conic-gradient(from_120deg_at_50%_50%,#f9ce34,#ee2a7b,#6228d7,#f9ce34)]" aria-hidden />
            Instagram
          </a>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
            className={chromeButton}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full border border-white/30 text-[13px] text-white/80">
              {isFullscreen ? "×" : "FS"}
            </span>
            <span className="hidden sm:inline">
              {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAboutOpen((v) => !v);
              setProjectsOpen(false);
            }}
            className={chromeButton}
            aria-expanded={aboutOpen}
            aria-controls="about-panel"
          >
            About
            <span className="text-base leading-none">{aboutOpen ? "–" : "+"}</span>
          </button>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-white/55">
          <span className="text-white/80">{photoCount}</span> stills
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span className="text-white/80">{videoCount}</span> motion
        </div>
      </div>

      <div
        className={`fixed left-1/2 z-20 flex w-[min(1140px,calc(100%-28px))] -translate-x-1/2 flex-col gap-4 px-4 text-left text-white transition duration-700 ease-out sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:px-8 ${
          introReady ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
        style={{ top: safeTopHero }}
      >
        <div className="max-w-[560px] space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.38em] text-white/60">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/70">
              Portrait direction
            </span>
            <span className="text-white/50">Identity · Motion · Web</span>
          </div>
          <h1 className="font-[var(--font-display)] text-[clamp(2.2rem,6vw,4.6rem)] uppercase leading-[0.95] text-white">
            Portraits that hit harder{" "}
            <span className="bg-[linear-gradient(90deg,var(--accent),var(--accent-lime),var(--accent-hot))] bg-clip-text text-transparent">
              in motion
            </span>
            .
          </h1>
          <p className="text-sm sm:text-base leading-6 text-white/75">
            CB builds cinematic portrait worlds for studios and cultural brands, turning quiet stories into loud launches.{" "}
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 transition hover:text-white"
            >
              Read full bio
              <span aria-hidden>→</span>
            </button>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href={`mailto:${siteConfig.email}`} className={heroPrimary}>
              Start a project
            </a>
            <button type="button" onClick={() => scrollToIndex(0)} className={heroSecondary}>
              Watch reel
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.32em] text-white/55">
            <span>{slides.length} frames</span>
            <span>{photoCount} stills</span>
            <span>{videoCount} motion</span>
            <span className="text-white/45">Scroll or arrow keys</span>
            <span className="text-white/45">Press F for fullscreen</span>
          </div>
        </div>
        <div className="hidden sm:flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-[10px] uppercase tracking-[0.28em] text-white/65 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <span className="text-white/80">Now booking</span>
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-xs font-semibold uppercase tracking-[0.22em] text-white/90"
          >
            {siteConfig.email}
          </a>
          <span className="text-white/45">Worldwide</span>
        </div>
      </div>

      {aboutOpen && (
        <div
          id="about-panel"
          role="dialog"
          aria-modal="false"
          aria-label="About CB"
          className="fixed right-4 z-40 w-[min(360px,calc(100%-28px))] rounded-3xl border border-white/10 bg-[#0c101b]/85 px-5 py-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:right-6"
          style={{ top: safeTopPanel }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm leading-6 text-white/90">
                Portrait sets captured by CB, meant to be explored fullscreen. Each scroll is tuned for soft motion and full-bleed frames.
              </p>
              <p className="text-xs text-white/60">
                Built with Next.js and a physics-driven slider to keep the glide cinematic without sacrificing speed. Tap Fullscreen (or press F) to hide the chrome.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAboutOpen(false)}
              className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label="Close about"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {projectsOpen && (
        <div
          id="projects-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Selected projects"
          className="fixed left-4 z-40 w-[min(520px,calc(100%-32px))] rounded-[32px] border border-white/10 bg-[#0c101b]/85 px-5 py-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:left-6"
          style={{ top: safeTopPanel }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Selected projects
                </p>
                <p className="text-sm text-white/80">
                  Outcomes that pair portrait-led storytelling with measurable lift.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((project) => (
                  <div
                    key={project.name}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
                  >
                    <p className="text-sm font-semibold text-white/95">{project.name}</p>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/60">{project.type}</p>
                    <p className="mt-2 text-xs text-white/80">{project.outcome}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/70">
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 font-semibold text-white/85 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Email
                </a>
                <a
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 font-semibold text-white/85 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Instagram
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProjectsOpen(false)}
              className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label="Close projects"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (slides.length === 0) {
    return (
      <section className="relative flex h-screen min-h-[100dvh] items-center justify-center bg-[#05060b] px-6 text-center text-sm text-white/70">
        {topChrome}
        <div className="rounded-[38px] border border-white/15 bg-white/5 px-6 py-10 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
          No images yet. Add files to <code className="rounded bg-white/10 px-1">public/photos</code> and refresh to light up this view.
        </div>
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      aria-label="Immersive portrait slider"
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
      {topChrome}
      <div
        className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-t from-black/70 via-black/35 to-transparent"
        aria-hidden
      />
      <div className="fixed bottom-6 right-6 z-30 hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md sm:flex">
        <span>Frame {active + 1}</span>
        <div className="h-[2px] w-24 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[color:var(--accent)] shadow-[0_0_14px_rgba(49,246,255,0.8)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

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
                const textOpacity = motionSafe
                  ? (introReady ? 1 : 0) * (1 - Math.min(0.3 * eased, 0.6))
                  : 1;
                const textTranslate = motionSafe ? 10 + eased * 4 + (introReady ? 0 : 10) : 0;
                const transitionDelay = motionSafe && introReady ? `${Math.min(idx, 10) * 24}ms` : "0ms";
                const shouldPlay = slide.mediaType === "video" && !reduceMotion && Math.abs(idx - active) <= 1;
                const mediaLabel = slide.title ? `${slide.title} — ${slide.subtitle}` : "Portrait capture";
                const altText = slide.mediaType === "video" ? "" : slide.title ? mediaLabel : formatAltFromSrc(slide.src);
                const frameLabel = String(idx + 1).padStart(2, "0");
                const totalLabel = String(slides.length).padStart(2, "0");

                return (
                  <article
                    key={`${slide.src}-${idx}`}
                    data-index={idx}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
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

                    <div className="absolute inset-0 z-20 flex flex-col justify-end gap-3 px-6 pb-[calc(env(safe-area-inset-bottom,0)+56px)] sm:px-10 sm:pb-[calc(env(safe-area-inset-bottom,0)+64px)]">
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
                        aria-hidden
                      />
                      <div
                        className="relative flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70"
                        style={{
                          opacity: Math.max(0, textOpacity - 0.1),
                          transform: `translateY(${textTranslate - 8}px)`,
                          transition: motionSafe
                            ? "opacity 900ms ease, transform 900ms cubic-bezier(.22,.61,.36,1)"
                            : "none",
                        }}
                      >
                        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                          Frame {frameLabel} / {totalLabel}
                        </span>
                        <span
                          className="h-[2px] w-12 bg-[linear-gradient(90deg,var(--accent),transparent)]"
                          aria-hidden
                        />
                      </div>
                      <h2
                        className="relative font-[var(--font-display)] text-[clamp(2.6rem,6vw,5rem)] uppercase leading-[0.95] tracking-[0.02em] text-white drop-shadow-[0_12px_36px_rgba(0,0,0,0.55)]"
                        style={{
                          opacity: textOpacity,
                          transform: `translateY(${textTranslate}px)`,
                          transition: motionSafe
                            ? "opacity 900ms ease, transform 900ms cubic-bezier(.22,.61,.36,1)"
                            : "none",
                        }}
                      >
                        {slide.title}
                      </h2>
                      <p
                        className="relative text-sm sm:text-base text-white/80 drop-shadow-[0_10px_28px_rgba(0,0,0,0.55)]"
                        style={{
                          opacity: Math.max(0, textOpacity - 0.05),
                          transform: `translateY(${textTranslate + 6}px)`,
                          transition: motionSafe
                            ? "opacity 900ms ease, transform 900ms cubic-bezier(.22,.61,.36,1)"
                            : "none",
                        }}
                      >
                        {slide.subtitle}
                      </p>
                    </div>
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
