import type { NextConfig } from 'next';

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firetminds.s3.ap-south-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
} satisfies NextConfig;

export default nextConfig;
