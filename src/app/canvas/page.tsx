import { listPhotoGroups } from "@/lib/photos";
import { DeckGallery } from "@/components/deck-gallery";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function CanvasPage() {
  const groups = await listPhotoGroups();
  const photos = groups.flatMap((g) => g.sets.flatMap((s) => s.photos.map((p) => p.src)));
  const shuffled = shuffle(photos);
  return <DeckGallery photos={shuffled} />;
}
