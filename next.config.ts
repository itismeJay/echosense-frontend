import type { NextConfig } from "next";
import { LEGACY_REDIRECTS } from "./lib/legacy-routes";

const nextConfig: NextConfig = {
  // The dev badge sits over the sidebar footer; errors still show in the console.
  devIndicators: false,
  async redirects() {
    return LEGACY_REDIRECTS.map((route) => ({ ...route, permanent: false }));
  },
};

export default nextConfig;
