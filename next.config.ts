import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["@/components", "@/hooks"],
  },
  // Ensure server works in WSL/Docker environments
  async rewrites() {
    return [];
  },
  // Add webpack configuration to handle client components better
  webpack: (config, { isServer }) => {
    // Fix for client component issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
