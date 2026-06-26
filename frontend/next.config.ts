import type { NextConfig } from "next";
// @ts-ignore
import withPWAInit from "next-pwa";

const config: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: 'http://localhost:8000/media/:path*',
      },
    ];
  },
};

// Check if Turbopack is running (standard next dev in newer versions defaults to Turbopack)
const isTurbo = process.argv.includes('--turbo') || process.env.TURBOPACK === '1' || process.env.NODE_ENV === 'development';

const nextConfig = isTurbo
  ? config
  : (() => {
      try {
        if (typeof withPWAInit === "function") {
          return withPWAInit({
            dest: "public",
            disable: process.env.NODE_ENV === "development",
            register: true,
            skipWaiting: true,
          })(config);
        }
      } catch (err) {
        console.warn("next-pwa initialization bypassed due to compatibility error:", err);
      }
      return config;
    })();

export default nextConfig;
