import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compiler: { styledComponents: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  rewrites: async () => {
    return [
      {
        source: '/auth/:path*',
        destination: `${process.env.BACKEND_URL || 'https://edrms-express-server-ahmadzubayer.vercel.app'}/api/auth/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'https://edrms-express-server-ahmadzubayer.vercel.app'}/api/:path*`,
      },
      {
        source: '/user-files/:path*',
        destination: `${process.env.BACKEND_URL || 'https://edrms-express-server-ahmadzubayer.vercel.app'}/user-files/:path*`,
      },
    ];
  },
};

export default nextConfig;
