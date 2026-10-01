import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  async rewrites() {
    const backend = process.env.API_INTERNAL_URL || "http://127.0.0.1:4000";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  }
};

export default nextConfig;
