#!/usr/bin/env node
/**
 * Batch-compress photos into an optimized folder.
 *
 * Defaults: input public/photos, output public/photos-optimized,
 * format webp, max dimension 1800px, quality 82, strip metadata.
 *
 * Env overrides:
 *   SOURCE_DIR=public/photos-raw
 *   OUTPUT_DIR=public/photos-optimized
 *   FORMAT=avif|webp|jpeg|png|jpg
 *   SECONDARY_FORMAT=webp          # optional extra output per file
 *   MAX_DIM=1600                   # max width/height
 *   QUALITY=85
 *   KEEP_METADATA=1                # keep EXIF/IPTC instead of stripping
 *   FORCE=1                        # rewrite even if newer outputs exist
 *   DRY_RUN=1                      # show plan without writing files
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

const SUPPORTED_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const ROOT = process.cwd();

const resolveDir = (maybe, fallback) =>
  path.isAbsolute(maybe || "") ? maybe : path.join(ROOT, maybe || fallback);

const INPUT_DIR = resolveDir(process.env.SOURCE_DIR, path.join("public", "photos"));
const OUTPUT_DIR = resolveDir(process.env.OUTPUT_DIR, path.join("public", "photos-optimized"));
const FORMAT = (process.env.FORMAT || "webp").toLowerCase();
const SECONDARY_FORMAT = (process.env.SECONDARY_FORMAT || "").toLowerCase() || null;
const MAX_DIM = Number.parseInt(process.env.MAX_DIM || process.env.MAX_WIDTH || "1800", 10);
const QUALITY = Number.parseInt(process.env.QUALITY || "82", 10);
const KEEP_METADATA = process.env.KEEP_METADATA === "1";
const FORCE = process.env.FORCE === "1";
const DRY_RUN = process.env.DRY_RUN === "1";
const CONCURRENCY = Math.max(2, Math.min(8, (os.cpus()?.length || 4) - 1));

const encoders = {
  webp: (img) => img.webp({ quality: QUALITY, effort: 4, nearLossless: false }),
  avif: (img) => img.avif({ quality: QUALITY, effort: 6 }),
  jpeg: (img) =>
    img.jpeg({
      quality: QUALITY,
      mozjpeg: true,
      chromaSubsampling: "4:4:4",
      progressive: true,
      optimiseCoding: true,
    }),
  jpg: (img) =>
    img.jpeg({
      quality: QUALITY,
      mozjpeg: true,
      chromaSubsampling: "4:4:4",
      progressive: true,
      optimiseCoding: true,
    }),
  png: (img) => img.png({ quality: QUALITY, compressionLevel: 9, adaptiveFiltering: true }),
};

const outputsFor = (format, secondary) => {
  const uniq = [format, secondary].filter(Boolean).filter((f, idx, arr) => arr.indexOf(f) === idx);
  return uniq.filter((f) => encoders[f]);
};

async function listPhotos() {
  const entries = await fs.readdir(INPUT_DIR);
  return entries.filter((f) => SUPPORTED_EXTS.has(path.extname(f).toLowerCase()));
}

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function compressOne(filename) {
  const inputPath = path.join(INPUT_DIR, filename);
  const inputStat = await fs.stat(inputPath);
  const { name } = path.parse(filename);
  const formats = outputsFor(FORMAT, SECONDARY_FORMAT);
  const outputs = formats.map((fmt) => ({
    fmt,
    path: path.join(OUTPUT_DIR, `${name}.${fmt === "jpg" ? "jpg" : fmt}`),
  }));

  if (!FORCE) {
    const fresh = await Promise.all(
      outputs.map(async (o) => {
        if (!(await fileExists(o.path))) return false;
        const stat = await fs.stat(o.path);
        return stat.mtimeMs >= inputStat.mtimeMs;
      })
    );
    if (fresh.every(Boolean)) {
      console.log(`• Skipping ${filename} (up to date)`);
      return { skipped: true, src: inputStat.size, out: 0 };
    }
  }

  if (DRY_RUN) {
    outputs.forEach((o) => {
      console.log(`↻ [dry-run] ${filename} → ${path.relative(ROOT, o.path)} (${o.fmt}, ≤${MAX_DIM}px, q${QUALITY})`);
    });
    return { skipped: true, src: inputStat.size, out: 0 };
  }

  const base = sharp(inputPath, { failOnError: false })
    .rotate()
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true });

  const results = [];
  for (const o of outputs) {
    const encode = encoders[o.fmt] || encoders.webp;
    let pipeline = encode(base.clone());
    if (KEEP_METADATA) pipeline = pipeline.withMetadata();
    await pipeline.toFile(o.path);
    const outStat = await fs.stat(o.path);
    console.log(
      `✓ ${filename} → ${path.relative(ROOT, o.path)} (${Math.round(outStat.size / 1024)} KB, ≤${MAX_DIM}px, ${
        o.fmt
      })`
    );
    results.push(outStat.size);
  }

  return { skipped: false, src: inputStat.size, out: results.reduce((a, b) => a + b, 0) };
}

async function main() {
  const files = await listPhotos();
  if (files.length === 0) {
    console.log(`No photos found in ${path.relative(ROOT, INPUT_DIR)}. Add some first.`);
    return;
  }
  await ensureOutputDir();
  console.log(
    `Compressing ${files.length} file(s) from ${path.relative(ROOT, INPUT_DIR)} → ${path.relative(
      ROOT,
      OUTPUT_DIR
    )} as ${FORMAT}${SECONDARY_FORMAT ? ` + ${SECONDARY_FORMAT}` : ""} (max ${MAX_DIM}px, q${QUALITY})`
  );

  let idx = 0;
  let totalSrc = 0;
  let totalOut = 0;
  let processed = 0;
  let skipped = 0;

  const worker = async () => {
    while (idx < files.length) {
      const current = files[idx++];
      try {
        const res = await compressOne(current);
        totalSrc += res.src;
        totalOut += res.out;
        if (res.skipped) skipped += 1;
        else processed += 1;
      } catch (err) {
        console.error(`✕ Failed on ${current}:`, err?.message || err);
      }
    }
  };
  const workers = Array.from({ length: CONCURRENCY }, worker);
  await Promise.all(workers);

  if (DRY_RUN) {
    console.log(`Dry run complete. Planned ${files.length - skipped} write(s), skipped ${skipped}.`);
    return;
  }

  const saved = totalSrc > 0 ? ((totalSrc - totalOut) / totalSrc) * 100 : 0;
  console.log(
    `Done. Wrote ${processed} file(s), skipped ${skipped}. Size: ${Math.round(
      totalSrc / 1024
    )} KB → ${Math.round(totalOut / 1024)} KB (${saved.toFixed(1)}% saved).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
