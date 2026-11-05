import type { NextConfig } from "next";

const backend = new URL(process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:3001");
if (!["http:", "https:"].includes(backend.protocol)
  || backend.username || backend.password || backend.pathname !== "/"
  || backend.search || backend.hash) {
  throw new Error("BACKEND_ORIGIN must be an HTTP(S) origin without credentials, path or query.");
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  async rewrites() {
    return [{
      source: "/api/v1/:path*",
      destination: `${backend.origin}/api/v1/:path*`,
    }];
  },
};

export default nextConfig;
