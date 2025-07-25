import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'http',
            hostname: 'localhost',
            port: '5000',
            pathname: '/uploads/**', // allow images under /uploads
          },
          {
            protocol: 'https',
            hostname: 'res.cloudinary.com',
            pathname: '/**', // allow all images from cloudinary
          },
          {
            protocol: 'https',
            hostname: 'res.cloudinary.com',
            pathname: '/**',
          },
        ],
      },    
};

export default nextConfig;
