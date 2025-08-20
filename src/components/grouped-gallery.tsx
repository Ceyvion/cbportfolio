"use client";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import type { PersonGroup } from "@/lib/photos";

type OpenState = null | { personKey: string; setKey: string; index: number };

export function GroupedGallery({ groups }: { groups: PersonGroup[] }) {
  const [open, setOpen] = useState<OpenState>(null);

  const flat = useMemo(() => {
    const map = new Map<string, { person: string; set: string; photos: { src: string; alt: string }[] }>();
    for (const g of groups) {
      for (const s of g.sets) {
        map.set(s.setKey, {
          person: g.person,
          set: s.set,
          photos: s.photos.map((p) => ({ src: p.src, alt: `${g.person} — Set ${s.set}` })),
        });
      }
    }
    return map;
  }, [groups]);

  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(() => {
    if (!open) return;
    const group = flat.get(open.setKey);
    if (!group) return;
    const nextIndex = (open.index + group.photos.length - 1) % group.photos.length;
    setOpen({ ...open, index: nextIndex });
  }, [open, flat]);
  const next = useCallback(() => {
    if (!open) return;
    const group = flat.get(open.setKey);
    if (!group) return;
    const nextIndex = (open.index + 1) % group.photos.length;
    setOpen({ ...open, index: nextIndex });
  }, [open, flat]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
      <aside className="md:sticky md:top-16 self-start">
        <nav className="rounded-lg border border-black/10 dark:border-white/15 p-3 text-sm">
          <ul className="space-y-1">
            {groups.map((g) => (
              <li key={g.personKey}>
                <a href={`#person-${g.personKey}`} className="font-medium hover:underline">
                  {g.person}
                </a>
                <ul className="mt-1 ml-3 space-y-1">
                  {g.sets.map((s) => (
                    <li key={s.setKey}>
                      <a href={`#${s.setKey}`} className="text-black/70 dark:text-white/70 hover:underline">
                        Set {s.set}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g.personKey} id={`person-${g.personKey}`}>
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">{g.person}</h3>
            <div className="space-y-8 mt-4">
              {g.sets.map((s) => (
                <div key={s.setKey} id={s.setKey}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Set {s.set}</h4>
                    <span className="text-xs text-black/60 dark:text-white/60">{s.photos.length} photos</span>
                  </div>
                  <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {s.photos.map((p, idx) => (
                      <button
                        key={p.src}
                        onClick={() => setOpen({ personKey: g.personKey, setKey: s.setKey, index: idx })}
                        className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-black/[0.04] dark:bg-white/[0.06]"
                        aria-label={`Open ${g.person} Set ${s.set} image ${idx + 1}`}
                      >
                        <Image
                          src={p.src}
                          alt={`${g.person} — Set ${s.set}`}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {open && (
        <Lightbox open={open} close={close} prev={prev} next={next} flat={flat} />)
      }
    </div>
  );
}

function Lightbox({
  open,
  close,
  prev,
  next,
  flat,
}: {
  open: NonNullable<OpenState>;
  close: () => void;
  prev: () => void;
  next: () => void;
  flat: Map<string, { person: string; set: string; photos: { src: string; alt: string }[] }>;
}) {
  const group = flat.get(open.setKey);
  if (!group) return null;
  const item = group.photos[open.index];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={close}
      role="dialog"
      aria-modal
    >
      <div className="relative w-full max-w-6xl aspect-[16/10]" onClick={(e) => e.stopPropagation()}>
        <Image src={item.src} alt={item.alt} fill sizes="100vw" className="object-contain" priority />
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
        <div className="absolute left-3 bottom-3 text-xs bg-black/70 text-white rounded px-2 py-1">
          {group.person} — Set {group.set} ({open.index + 1}/{group.photos.length})
        </div>
      </div>
    </div>
  );
}

