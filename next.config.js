/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    cssPreload: false,
  },
  // Configure static file serving
  async rewrites() {
    return [
      {
        source: '/data/:path*',
        destination: '/public/data/:path*',
      },
    ];
  },
};

export default nextConfig;