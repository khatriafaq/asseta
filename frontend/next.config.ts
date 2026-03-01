import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove "X-Powered-By: Next.js" response header
  poweredByHeader: false,

  // Strict mode catches double-invocation bugs early
  reactStrictMode: true,

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
