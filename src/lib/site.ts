export const siteConfig = {
  name: "CB Portfolio",
  title: "CB Portfolio — Designer & Developer",
  description:
    "Personal portfolio showcasing work, experiments, and writing across web and design.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  locale: "en_US",
  keywords: [
    "portfolio",
    "web development",
    "design",
    "react",
    "next.js",
    "tailwindcss",
  ],
  author: "CB",
  twitter: "@cb",
};

export type SiteConfig = typeof siteConfig;

