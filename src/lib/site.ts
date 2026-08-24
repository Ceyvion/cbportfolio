export const siteConfig = {
  name: "CB Portfolio",
  title: "CB Portfolio — Designer & Developer",
  description:
    "Personal portfolio showcasing work, experiments, and writing across web and design.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://cb.studio",
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
  twitter: "@cbstudio",
  email: "hello@cb.studio",
  instagram: "https://www.instagram.com/ceyvio",
};

export type SiteConfig = typeof siteConfig;
