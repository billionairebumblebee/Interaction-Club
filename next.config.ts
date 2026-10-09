import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return ["/admin/:path*", "/host/:path*", "/table/:path*", "/invitation/:path*", "/api/:path*", "/preview/:path*", "/host-preview"].map((source) => ({
      source,
      headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Cache-Control", value: "private, no-store" },
      ],
    }));
  },
};

export default nextConfig;
