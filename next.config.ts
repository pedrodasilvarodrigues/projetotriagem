import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "projetotriagem.vercel.app"
          }
        ],
        destination: "https://www.portalencaixe.com.br/:path*",
        permanent: true
      }
    ];
  },
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
