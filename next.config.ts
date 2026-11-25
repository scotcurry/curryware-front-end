import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal server.js + traced node_modules in .next/standalone for the Docker image.
  output: "standalone",
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Team, league and player images come from Yahoo.
    remotePatterns: [
      new URL("https://s.yimg.com/**"),
      new URL("https://yahoofantasysports-res.cloudinary.com/**"),
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
