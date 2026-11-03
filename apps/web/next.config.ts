import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@entre-nos/shared"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
