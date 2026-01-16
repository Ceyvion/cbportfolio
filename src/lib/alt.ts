function titleCase(input: string) {
  return input
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatAltFromSrc(src: string, fallback = "Portrait photograph") {
  const clean = src.split("?")[0];
  const filename = clean.split("/").pop() || "";
  const base = filename.replace(/\.[^/.]+$/, "");
  const normalized = base.replace(/[-_]+/g, " ").trim();
  if (!normalized) return fallback;
  return titleCase(normalized);
}
