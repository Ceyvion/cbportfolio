"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PersonGroup } from "@/lib/photos";

type Tile = { src: string; x: number; y: number; w: number; h: number; key: string };

export function CanvasGallery({ groups }: { groups: PersonGroup[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan/zoom state
  const [scale, setScale] = useState(1.0);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [isPanning, setIsPanning] = useState(false);

  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const moved = useRef(false);

  // Lightbox
  const [openTile, setOpenTile] = useState<Tile | null>(null);

  // Compute positions: cluster by person/set; spiral layout for clusters, grid inside each cluster
  const tiles = useMemo<Tile[]>(() => {
    const all: Tile[] = [];

    const personGolden = 2.399963229728653; // golden angle
    const personStep = 1100; // tighter spacing between people clusters
    const setRadius = 320; // tighter distance of set clusters from person
    const tileW = 240; // smaller tile width for denser layout
    const tileH = 170; // smaller tile height for denser layout
    const innerCols = 3;
    const innerGap = 10; // smaller gaps

    groups.forEach((g, gi) => {
      // Place person cluster center on a large spiral
      const pr = Math.sqrt(gi + 1) * personStep;
      const pth = gi * personGolden;
      const px = Math.cos(pth) * pr;
      const py = Math.sin(pth) * pr;

      // Place sets around the person center in a small ring using golden angle too
      g.sets.forEach((s, si) => {
        const sth = si * personGolden;
        const cx = px + Math.cos(sth) * setRadius;
        const cy = py + Math.sin(sth) * setRadius;

        s.photos.forEach((p, j) => {
          const col = j % innerCols;
          const row = Math.floor(j / innerCols);
          const x = cx + (col - (innerCols - 1) / 2) * (tileW + innerGap);
          const y = cy + row * (tileH + innerGap);
          all.push({ src: p.src, x, y, w: tileW, h: tileH, key: `${s.setKey}-${j}` });
        });
      });
    });

    return all;
  }, [groups]);

  // Center the origin on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { innerWidth, innerHeight } = window;
    setTx(innerWidth / 2);
    setTy(innerHeight / 2);
  }, []);

  // Wheel to pan; hold Ctrl/Cmd/Alt to zoom around cursor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const element: HTMLDivElement = el;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey || e.altKey) {
        const delta = -e.deltaY * 0.0015;
        const newScale = Math.max(0.2, Math.min(3, scale * (1 + delta)));
        const rect = element.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const wx = (px - tx) / scale;
        const wy = (py - ty) / scale;
        setScale(newScale);
        setTx(px - wx * newScale);
        setTy(py - wy * newScale);
      } else {
        setTx((p) => p - e.deltaX);
        setTy((p) => p - e.deltaY);
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as unknown as EventListener);
  }, [scale, tx, ty]);

  // Pointer-based panning
  function onPointerDown(e: ReactPointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    panStart.current = { x: e.clientX, y: e.clientY, tx, ty };
    moved.current = false;
    setIsPanning(true);
  }
  function onPointerMove(e: ReactPointerEvent) {
    if (!panStart.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved.current = true;
    setTx(panStart.current.tx + dx);
    setTy(panStart.current.ty + dy);
  }
  function onPointerUp() {
    panStart.current = null;
    setIsPanning(false);
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black"
      style={{ touchAction: "none", cursor: isPanning ? "grabbing" : "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="will-change-transform"
        style={{ transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})` }}
      >
        {/* Render tiles */}
        {tiles.map((t) => (
          <div
            key={t.key}
            className="absolute rounded-lg overflow-hidden shadow-sm shadow-black/40 ring-1 ring-white/10 hover:ring-white/20"
            style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
            onClick={() => {
              // Avoid click when dragging
              if (moved.current) return;
              setOpenTile(t);
            }}
          >
            <img
              src={t.src}
              alt=""
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Minimal lightbox with no text */}
      {openTile && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setOpenTile(null)}>
          <div className="relative w-full h-full max-w-[92vw] max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
            <img src={openTile.src} alt="" className="w-full h-full object-contain" />
            <button
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 text-black grid place-items-center hover:bg-white"
              onClick={() => setOpenTile(null)}
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
