import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence the lockfile warning
  // Allow access from local network devices (mobile, tablets, etc.)
  // @ts-ignore - allowedDevOrigins is available in dev mode
  allowedDevOrigins: ['192.168.68.51'],
};

export default nextConfig;
