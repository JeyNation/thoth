/** @type {import('next').NextConfig} */
const nextConfig = {
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