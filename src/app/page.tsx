import { listPhotoGroups } from "@/lib/photos";
import { ImmersiveSlider, type Slide } from "@/components/immersive-slider";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default async function Page() {
  const groups = await listPhotoGroups();
  const photoSlides: Slide[] = shuffle(
    groups.flatMap((g) =>
      g.sets.flatMap((s) =>
        s.photos.map((p, idx) => ({
          src: p.src,
          title: g.person,
          subtitle: `Set ${s.set} · Frame ${idx + 1} of ${s.photos.length}`,
          mediaType: "image" as const,
        }))
      )
    )
  );
  const videoSlide: Slide = {
    src: "/a%20good%20friend.MOV",
    title: "A Good Friend",
    subtitle: "Short film · Video",
    mediaType: "video",
  };
  const slides: Slide[] = [videoSlide, ...photoSlides];

  return (
    <ImmersiveSlider slides={slides} />
  );
}
