import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Design Style Reference",
  description: "Quick visual read of the palette, typography, and component treatments in use.",
  alternates: {
    canonical: "/style-guide",
  },
  openGraph: {
    title: "Design Style Reference",
    description: "Quick visual read of the palette, typography, and component treatments in use.",
    url: "/style-guide",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Design Style Reference",
    description: "Quick visual read of the palette, typography, and component treatments in use.",
  },
};

const palette = [
  { name: "Night Depth", value: "#0b0d12", role: "Base background" },
  { name: "Glass Mist", value: "rgba(255,255,255,0.08)", role: "Overlays / cards" },
  { name: "Seafoam Glow", value: "#479584", role: "Accent + highlights" },
  { name: "Aurora Violet", value: "#787ef1", role: "Secondary accent" },
  { name: "Soft Sand", value: "#f6f1e7", role: "Light surfaces" },
];

const typography = [
  { label: "Display", sample: "CB Portfolio", size: "text-5xl sm:text-6xl", weight: "font-light" },
  { label: "Title", sample: "Motion-led imagery", size: "text-3xl sm:text-4xl", weight: "font-semibold" },
  { label: "Body", sample: "Physics-driven galleries with glass edges.", size: "text-base", weight: "font-normal" },
  { label: "Mono detail", sample: "Grid 8 / 12 · Tracking 0.02em", size: "text-sm", weight: "font-medium" },
];

const treatments = [
  {
    title: "Glass buttons",
    body: "Rounded 14px radius, 1px white/20 border, backdrop blur 8–12px, uppercase microcopy.",
  },
  {
    title: "Gradient wash",
    body: "Radial color spots layered with linear fog to keep edges soft while preserving contrast.",
  },
  {
    title: "Motion curve",
    body: "Cubic-bezier(.22,.61,.36,1) for primary transitions; long drifts on linger states.",
  },
];

export default function StyleGuidePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0d12] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(900px 900px at 30% 18%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(1200px 1100px at 72% -4%, rgba(71,149,132,0.24), transparent 60%), radial-gradient(1000px 1000px at 42% 86%, rgba(120,126,241,0.22), transparent 62%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-transparent" aria-hidden />

      <div className="relative z-10 mx-auto flex w-[min(1180px,calc(100%-28px))] items-center justify-between gap-3 px-3 py-6 sm:px-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
          Design DNA
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="inline-flex h-2 w-2 rounded-full bg-[conic-gradient(from_120deg_at_50%_50%,#f9ce34,#ee2a7b,#6228d7,#f9ce34)]" aria-hidden />
          {siteConfig.name}
        </div>
      </div>

      <div className="relative z-10 mx-auto w-[min(1180px,calc(100%-28px))] space-y-12 px-3 pb-16 sm:px-6 sm:pb-20">
        <header className="space-y-4 rounded-[34px] border border-white/10 bg-white/5 px-5 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-7 sm:py-8">
          <div className="flex flex-wrap items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-white/60">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-semibold">
              Style Guide
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 font-medium text-white/50">
              Slider Aesthetic
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
              Atmosphere-first visual system for immersive galleries.
            </h1>
            <p className="max-w-3xl text-base text-white/75 sm:text-lg">
              Dark, cinematic base with conic highlights, glass edges, and uppercase microcopy. Animation favors ease-out glides and long, soft decays; surfaces stay minimal to keep the media forward.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-12">
          <div className="col-span-12 space-y-4 lg:col-span-7">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm uppercase tracking-[0.18em] text-white/60">Palette</div>
                <div className="text-xs font-medium text-white/60">Glass + Glow</div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {palette.map((color) => (
                  <div
                    key={color.name}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white/90">{color.name}</div>
                      <div className="text-xs text-white/60">{color.role}</div>
                    </div>
                    <div
                      className="h-12 w-12 rounded-xl border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                      style={{ background: color.value }}
                      aria-label={`${color.name} swatch`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm uppercase tracking-[0.18em] text-white/60">Typography</div>
                <div className="text-xs font-medium text-white/60">Geist Sans + Mono</div>
              </div>
              <div className="mt-6 space-y-4">
                {typography.map((entry) => (
                  <div
                    key={entry.label}
                    className="flex items-baseline justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className={`leading-tight ${entry.size} ${entry.weight}`}>
                      {entry.sample}
                    </div>
                    <div className="text-xs uppercase tracking-[0.18em] text-white/60">
                      {entry.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 space-y-4 lg:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm uppercase tracking-[0.18em] text-white/60">Micro Interactions</div>
                <div className="text-xs font-medium text-white/60">Easing & dwell</div>
              </div>
              <div className="mt-4 space-y-3">
                {treatments.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-base font-semibold text-white/90">{item.title}</div>
                    <p className="mt-2 text-sm text-white/70">{item.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-sm transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Primary
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Ghost
                </button>
                <span className="rounded-full border border-white/10 bg-gradient-to-r from-white/5 via-[#479584]/20 to-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/75">
                  Linger
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-[#479584]/15 p-[1px] shadow-[0_18px_70px_rgba(0,0,0,0.35)]">
              <div className="rounded-[22px] bg-[#0b0d12]/80 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="text-sm uppercase tracking-[0.18em] text-white/60">Grid & Rhythm</div>
                  <div className="text-xs font-medium text-white/60">8px root / 24px max</div>
                </div>
                <div className="mt-4 space-y-3 text-sm text-white/75">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-white/10">
                      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#479584] via-white to-[#787ef1]" />
                    </div>
                    <span className="text-xs text-white/60">Spacing ramp</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-white/10">
                      <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-white via-[#787ef1] to-transparent" />
                    </div>
                    <span className="text-xs text-white/60">Shadow softness</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-full border border-dashed border-white/25 px-3 py-2 text-center text-xs uppercase tracking-[0.2em] text-white/60">
                      Safe area aware
                    </div>
                  </div>
                  <p className="text-xs text-white/65">
                    Surfaces sit on glass cards with subtle blur; primary content runs edge-to-edge to echo the immersive slider.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-white/10 bg-white/5 px-5 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-7 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm uppercase tracking-[0.18em] text-white/60">Interaction Bar</div>
            <div className="text-xs font-medium text-white/60">Matches slider chrome</div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["Hover states maintain contrast with 20-30% border lift.", "Active states scale to 0.99 with long glide back.", "Text shadows stay soft to keep the filmic feel."].map(
              (note) => (
                <div
                  key={note}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75"
                >
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#479584]" aria-hidden />
                  {note}
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
