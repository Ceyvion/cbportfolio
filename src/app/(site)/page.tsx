import Link from "next/link";
import { listPhotoGroups } from "@/lib/photos";
import { GroupedGallery } from "@/components/grouped-gallery";

export default async function Home() {
  const groups = await listPhotoGroups();

  return (
    <main className="min-h-screen p-6 sm:p-10 font-[family-name:var(--font-geist-sans)]">
      <section className="mx-auto max-w-6xl">
        <h1 className="sr-only">Photography Portfolio</h1>
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <h2 id="gallery" className="text-2xl sm:text-3xl font-semibold">Gallery</h2>
          <Link href="#about" className="text-sm hover:underline">About</Link>
        </div>
        <GroupedGallery groups={groups} />
      </section>

      <section id="about" className="mx-auto max-w-6xl mt-16 sm:mt-24">
        <h2 className="text-2xl sm:text-3xl font-semibold">About</h2>
        <p className="mt-4 max-w-3xl text-black/70 dark:text-white/70">
          Photography portfolio featuring original artworks. Drop your images into
          <code className="mx-1 px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">public/photos</code>
          to populate the gallery.
        </p>
      </section>
    </main>
  );
}

