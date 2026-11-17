import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Photos produits envoyées depuis la page admin (Vercel limite les requêtes à ~4,5 Mo).
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  async redirects() {
    return [{ source: "/", destination: "/fr", permanent: false }];
  },
};

export default nextConfig;
