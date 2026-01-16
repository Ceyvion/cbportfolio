import type { Metadata } from "next";
import { listPhotoGroups } from "@/lib/photos";
import { DeckGallery } from "@/components/deck-gallery";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Canvas Gallery",
  description: "Physics-driven deck gallery of portrait sets with drag-based navigation.",
  alternates: {
    canonical: "/canvas",
  },
  openGraph: {
    title: "Canvas Gallery",
    description: "Physics-driven deck gallery of portrait sets with drag-based navigation.",
    url: "/canvas",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Canvas Gallery",
    description: "Physics-driven deck gallery of portrait sets with drag-based navigation.",
  },
};

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default async function CanvasPage() {
  const groups = await listPhotoGroups();
  const photos = shuffle(groups.flatMap((g) => g.sets.flatMap((s) => s.photos.map((p) => p.src))));
  return <DeckGallery photos={photos} />;
}
