# CB Portfolio (Next.js)

Interactive, physics-driven deck gallery for local photos. Built with Next.js 15 / React 19 RC and Tailwind.

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:3000/canvas

## Adding photos

- Drop `.jpg`, `.png`, `.webp`, or `.avif` files into `public/photos`.
- Filenames drive grouping: `first-last_1.jpg` → person: “First Last”, set `1`. A trailing number becomes the set id; everything before it becomes the person name.
- Lists are refreshed on page load; no additional metadata files needed.

## Using the deck

- Drag or fling cards horizontally to move through the stack; physics are clamped so cards settle cleanly.
- Keyboard: `←/→` change photos, `g` toggles gloss, `d` cycles density, `l` flips low-power mode, `a` toggles autoplay, `s` shuffles.
- Lightbox: click/tap a card, pinch/ctrl-scroll or double-click to zoom, swipe/arrow keys to move, `Esc` to close.
- Bottom scrubber lets you jump directly; safe-area insets are respected on mobile.

## Stability notes

- Neighbor images pre-decode and cache their load status, so shuffles and rapid navigation avoid flashes.
- Erroring images show a clear fallback overlay instead of sticking on a skeleton.
- Drag distances/velocities are clamped and springs are canceled on tab-hide to prevent runaway motion.

## Scripts

- `npm run dev` – start the dev server
- `npm run lint` – lint the project
- `npm run build` / `npm run start` – production build and serve
- `npm run compress:photos` – optimize everything in `public/photos` into `public/photos-optimized` (defaults: WebP, max dimension 1800px, quality 82). Override with env vars:
  - `FORMAT=avif|webp|jpeg|png|jpg` and optional `SECONDARY_FORMAT=webp` to emit two formats.
  - `MAX_DIM=1600` (or `MAX_WIDTH`) to clamp width/height.
  - `QUALITY=85`, `KEEP_METADATA=1`, `FORCE=1` to rewrite even if output is fresh, `DRY_RUN=1` to see the plan only.
  - `SOURCE_DIR=public/photos-raw`, `OUTPUT_DIR=public/photos-optimized`.

## Customization

- Update site metadata in `src/lib/site.ts`.
- Tailwind theme tweaks live in `tailwind.config.ts`.
