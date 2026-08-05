import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf"],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  },
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
