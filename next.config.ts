import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [480, 640, 768, 960, 1200, 1600, 1920],
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
