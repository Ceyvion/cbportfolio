import fs from "fs";
import path from "path";

const PHOTO_DIR = path.join(process.cwd(), "public", "photos");
const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export type Photo = {
  src: string;
  filename: string;
  person: string; // display name
  personKey: string; // slug
  set: string; // numeric or label
  setKey: string;
};

export type PersonGroup = {
  person: string;
  personKey: string;
  sets: Array<{
    set: string;
    setKey: string;
    photos: Photo[];
  }>;
};

export function listPhotos(): string[] {
  try {
    const names = fs.readdirSync(PHOTO_DIR);
    return names
      .filter((n) => exts.has(path.extname(n).toLowerCase()))
      .map((n) => `/photos/${n}`);
  } catch {
    return [];
  }
}

function titleCase(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function slugify(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseMeta(file: string): Photo {
  const filename = path.basename(file);
  const name = filename.replace(path.extname(filename), "");
  const tokens = name.split(/[\s_-]+/).filter(Boolean);

  // Look for trailing numeric token as set number
  let set = "1";
  let personTokens = tokens;
  if (tokens.length > 1 && /^\d+$/.test(tokens[tokens.length - 1])) {
    set = String(parseInt(tokens[tokens.length - 1], 10));
    personTokens = tokens.slice(0, -1);
  }

  // If still empty, fallback to first token as person
  if (personTokens.length === 0) {
    personTokens = [name];
  }

  const personRaw = personTokens.join(" ");
  const person = titleCase(personRaw.replace(/[-_]+/g, " "));
  const personKey = slugify(person);
  const setKey = `${personKey}-set-${set}`;

  return {
    src: `/photos/${filename}`,
    filename,
    person,
    personKey,
    set,
    setKey,
  };
}

export function listPhotoGroups(): PersonGroup[] {
  try {
    const names = fs
      .readdirSync(PHOTO_DIR)
      .filter((n) => exts.has(path.extname(n).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const photos = names.map((n) => parseMeta(n));

    const byPerson = new Map<string, PersonGroup>();
    for (const p of photos) {
      const existing = byPerson.get(p.personKey);
      if (!existing) {
        byPerson.set(p.personKey, { person: p.person, personKey: p.personKey, sets: [] });
      }
    }

    // Group by person+set
    for (const p of photos) {
      const group = byPerson.get(p.personKey)!;
      let setEntry = group.sets.find((s) => s.setKey === p.setKey);
      if (!setEntry) {
        setEntry = { set: p.set, setKey: p.setKey, photos: [] };
        group.sets.push(setEntry);
      }
      setEntry.photos.push(p);
    }

    // Sort sets numerically and photos by filename
    const groups = Array.from(byPerson.values()).sort((a, b) =>
      a.person.localeCompare(b.person)
    );
    for (const g of groups) {
      g.sets.sort((a, b) => parseInt(a.set, 10) - parseInt(b.set, 10));
      for (const s of g.sets) {
        s.photos.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
      }
    }

    return groups;
  } catch {
    return [];
  }
}
