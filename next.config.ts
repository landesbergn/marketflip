import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack root to this project so a stray ~/package-lock.json
  // doesn't make Next infer the wrong workspace root.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
