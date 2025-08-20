"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export function DeckGallery({ photos }: { photos: string[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [lowPower, setLowPower] = useState(false);
  const [index, setIndex] = useState(0);
  const dragging = useRef<
    | null
    | {
        startX: number;
        lastX: number;
        lastT: number;
        prevX: number;
        prevT: number;
      }
  >(null);
  const [lightbox, setLightbox] = useState<null | number>(null);
  const [glossy, setGlossy] = useState(true);
  const [densityIdx, setDensityIdx] = useState(1); // 0: tight, 1: balanced, 2: loose
  const deckRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  // spring back animation for dragX
  const animRef = useRef<number | null>(null);
  const xRef = useRef(0);
  const vRef = useRef(0);
  const lastTRef = useRef<number>(0);
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);

  const count = photos.length;

  // Auto low-power detection: motion preference, pointer, device memory, and quick FPS probe
  useEffect(() => {
    let lp = false;
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) lp = true;
      if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) lp = true;
      const dm = (navigator as any).deviceMemory;
      if (typeof dm === 'number' && dm <= 4) lp = true;
    } catch {}
    setLowPower(lp);
    let frames = 0;
    let start = performance.now();
    let raf = requestAnimationFrame(function loop(now: number) {
      frames++;
      if (now - start > 900) {
        const fps = (frames * 1000) / (now - start);
        if (fps < 50) setLowPower(true);
        return;
      }
      raf = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightbox != null) {
        if (e.key === "Escape") setLightbox(null);
        if (e.key === "ArrowRight") setLightbox((i) => (i == null ? i : (i + 1) % count));
        if (e.key === "ArrowLeft") setLightbox((i) => (i == null ? i : (i + count - 1) % count));
        return;
      }
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, count - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (e.key.toLowerCase() === "g") setGlossy((v) => !v);
      if (e.key.toLowerCase() === "d") setDensityIdx((i) => (i + 1) % 3);
      if (e.key.toLowerCase() === "l") setLowPower((v) => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, lightbox]);

  // Disable glossy automatically when low power flips on
  useEffect(() => {
    if (lowPower) setGlossy(false);
  }, [lowPower]);

  // Reset drag variable when index changes
  useEffect(() => {
    xRef.current = 0;
    vRef.current = 0;
    if (deckRef.current) deckRef.current.style.setProperty("--drag-x", `0px`);
    if (rootRef.current) {
      rootRef.current.style.setProperty("--tilt-x", `0deg`);
      rootRef.current.style.setProperty("--tilt-y", `0deg`);
    }
  }, [index]);

  const visible = useMemo(() => {
    const around = lowPower ? 4 : 6; // render fewer cards in low-power
    const arr: { idx: number; offset: number }[] = [];
    for (let k = Math.max(0, index - around); k <= Math.min(count - 1, index + around); k++) {
      arr.push({ idx: k, offset: k - index });
    }
    return arr;
  }, [index, count, lowPower]);

  const densities = [
    { spacingX: 70, spacingY: 14, falloff: 0.055, blur: 0.8, width: "min(82vw,760px)" },
    { spacingX: 90, spacingY: 18, falloff: 0.06, blur: 1.0, width: "min(92vw,900px)" },
    { spacingX: 120, spacingY: 24, falloff: 0.07, blur: 1.2, width: "min(96vw,1080px)" },
  ] as const;
  const d = densities[densityIdx];

  // Spring animation util inside component scope
  const startSpringTo = (target: number, initialVelocityPxPerMs = 0) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    vRef.current = initialVelocityPxPerMs * 800; // convert to px/s-ish scale
    lastTRef.current = performance.now();
    const k = 90; // spring stiffness
    const c = 18; // damping
    const tick = (now: number) => {
      const dt = Math.min(1 / 30, Math.max(0.0001, (now - lastTRef.current) / 1000));
      lastTRef.current = now;
      const x = xRef.current;
      let v = vRef.current;
      const a = -k * (x - target) - c * v;
      v += a * dt;
      const nx = x + v * dt;
      xRef.current = nx;
      vRef.current = v;
      if (deckRef.current) deckRef.current.style.setProperty("--drag-x", `${nx.toFixed(1)}px`);
      if (Math.abs(nx - target) < 0.5 && Math.abs(v) < 5) {
        if (deckRef.current) deckRef.current.style.setProperty("--drag-x", `${target}px`);
        animRef.current = null;
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const now = performance.now();
    dragging.current = { startX: e.clientX, lastX: e.clientX, lastT: now, prevX: e.clientX, prevT: now };
    // cancel spring animation when user re-grabs
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    movedRef.current = false;
    if (rootRef.current) rootRef.current.style.cursor = "grabbing";
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const deck = deckRef.current;
    const root = rootRef.current;
    if (deck && root) {
      const rect = deck.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width; // 0..1
      const ny = (e.clientY - rect.top) / rect.height; // 0..1
      const mx = nx * 2 - 1;
      const my = ny * 2 - 1;
      root.style.setProperty("--tilt-x", `${clamp(-8, 8, -my * 8)}deg`);
      root.style.setProperty("--tilt-y", `${clamp(-10, 10, mx * 10)}deg`);
      root.style.setProperty("--gx", `${50 + mx * 18}%`);
      root.style.setProperty("--gy", `${38 + my * 12}%`);
    }
    if (!dragging.current) return;
    const now = performance.now();
    const dx = e.clientX - dragging.current.startX;
    if (!movedRef.current && Math.abs(dx) > 6) movedRef.current = true;
    dragging.current.prevX = dragging.current.lastX;
    dragging.current.prevT = dragging.current.lastT;
    dragging.current.lastX = e.clientX;
    dragging.current.lastT = now;
    xRef.current = dx;
    if (deckRef.current) deckRef.current.style.setProperty("--drag-x", `${dx.toFixed(1)}px`);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    const { startX, lastX, lastT, prevX, prevT } = dragging.current;
    const dx = lastX - startX;
    const threshold = 120;
    const v = (lastX - prevX) / Math.max(1, lastT - prevT); // px per ms
    dragging.current = null;
    if (rootRef.current) rootRef.current.style.cursor = "grab";
    if (dx > threshold || v > 0.8) setIndex((i) => Math.max(0, i - 1));
    else if (dx < -threshold || v < -0.8) setIndex((i) => Math.min(count - 1, i + 1));
    else startSpringTo(0, v);
    if (movedRef.current) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 250);
    }
  };

  const onPointerLeave = () => {
    if (rootRef.current) {
      rootRef.current.style.setProperty("--tilt-x", `0deg`);
      rootRef.current.style.setProperty("--tilt-y", `0deg`);
      rootRef.current.style.cursor = "grab";
    }
  };

  if (!mounted || count === 0) return <div className="fixed inset-0 bg-black" />;

  return (
    <div ref={rootRef} className="fixed inset-0 bg-black text-white select-none" style={{ touchAction: "pan-y", cursor: "grab" }}>
      {/* Ambient reactive background */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(1000px 700px at var(--gx,50%) var(--gy,40%), rgba(255,255,255,0.06), rgba(255,255,255,0.0) 60%),\
             radial-gradient(1400px 900px at 40% 60%, rgba(14,165,233,0.06), rgba(14,165,233,0.0) 60%),\
             radial-gradient(1400px 900px at 70% 30%, rgba(147,51,234,0.05), rgba(147,51,234,0.0) 60%)",
          opacity: lowPower ? 0.6 : 0.9,
          mixBlendMode: "screen",
        }}
      />
      {/* Subtle noise overlay (skip in low-power) */}
      {!lowPower && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg xmlns=\\\"http://www.w3.org/2000/svg\\\" width=\\\"160\\\" height=\\\"160\\\" viewBox=\\\"0 0 160 160\\\"><filter id=\\\"n\\\"><feTurbulence type=\\\"fractalNoise\\\" baseFrequency=\\\"0.9\\\" numOctaves=\\\"2\\\" stitchTiles=\\\"stitch\\\"/></filter><rect width=\\\"100%\\\" height=\\\"100%\\\" filter=\\\"url(%23n)\\\" opacity=\\\"0.5\\\"/></svg>')",
            backgroundSize: "auto",
          }}
        />
      )}
      <div
        className="absolute inset-0"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        {/* Deck */}
        <div
          ref={deckRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 aspect-[3/2]"
          style={{ width: d.width }}
        >
          {visible.map(({ idx, offset }) => {
            const isCenter = offset === 0;
            // Natural jitter based on index for non-uniform stack
            const jitter = seededJitter(idx);
            const baseTranslateX = isCenter
              ? `calc(${offset * d.spacingX}px + var(--drag-x, 0px))`
              : `${offset * d.spacingX + jitter.x}px`;
            const baseTranslateY = `${Math.abs(offset) * d.spacingY + (isCenter ? 0 : jitter.y)}px`;
            const rot = offset * 2.5 + (isCenter ? 0 : jitter.r);
            const scale = 1 - Math.min(d.falloff * Math.abs(offset), 0.4);
            const z = 100 - Math.abs(offset);
            const blur = (lowPower ? 0 : 1) * Math.max(0, Math.abs(offset) - 1) * d.blur;

            // Tilt and gloss for center card
            const transform = `translate3d(${baseTranslateX}, ${baseTranslateY}, 0) rotate(${rot}deg) scale(${scale}) perspective(1200px) ${
              isCenter ? "rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))" : ""
            }`;
            return (
              <button
                key={idx}
                className="absolute inset-0 rounded-2xl overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.55)] ring-1 ring-white/15"
                style={{
                  transform,
                  zIndex: z,
                  filter: `blur(${blur}px)`,
                  transition: isCenter
                    ? "transform 250ms cubic-bezier(.2,.8,.2,1)"
                    : "transform 500ms cubic-bezier(.2,.8,.2,1), filter 400ms",
                  willChange: "transform, filter",
                  contain: "layout paint size style",
                  background: glossy
                    ? "radial-gradient(1200px 800px at 50% -10%, rgba(255,255,255,0.18), rgba(255,255,255,0.02))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                }}
                onClick={(e) => {
                  if (suppressClickRef.current || dragging.current) return;
                  // If there's meaningful drag distance, treat as drag not click
                  if (Math.abs(xRef.current) > 6) return;
                  setLightbox(idx);
                }}
                aria-label="Open image"
              >
                <div className={`absolute inset-0 bg-white/[0.06] ${lowPower ? 'backdrop-blur-none' : 'backdrop-blur-sm'}`} />
                <img
                  src={photos[idx]}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover ${lowPower ? '' : 'mix-blend-luminosity'}`}
                  decoding="async"
                  loading={isCenter ? 'eager' : 'lazy'}
                  fetchpriority={isCenter ? 'high' : 'low'}
                  draggable={false}
                />
                {/* Edge vignettes + glossy highlight via CSS vars */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/5" />
                  {glossy && (
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        background:
                          "radial-gradient(560px 320px at var(--gx,50%) var(--gy,30%), rgba(255,255,255,0.22), rgba(255,255,255,0.0) 60%)",
                      }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox != null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <div className="relative w-full h-full max-w-[94vw] max-h-[94vh]" onClick={(e) => e.stopPropagation()}>
            <img src={photos[lightbox]} alt="" className="w-full h-full object-contain" />
            <button
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 text-black grid place-items-center hover:bg-white"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function clamp(min: number, max: number, v: number) {
  return Math.max(min, Math.min(max, v));
}

function seededJitter(seed: number) {
  // deterministic small offsets
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = s - Math.floor(s);
  const s2 = Math.sin((seed + 1) * 78.233) * 12345.6789;
  const frac2 = s2 - Math.floor(s2);
  const s3 = Math.sin((seed + 2) * 19.19) * 7654.321;
  const frac3 = s3 - Math.floor(s3);
  return {
    x: (frac - 0.5) * 8,
    y: (frac2 - 0.5) * 6,
    r: (frac3 - 0.5) * 1.6,
  };
}

// no-op placeholder removed; in-component startSpringTo handles spring animation
