import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve images as-is from public/ without on-the-fly optimization
    unoptimized: true,
  },
};

export default nextConfig;
