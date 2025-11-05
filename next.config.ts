import type { NextConfig } from 'next';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Enable production optimizations
  reactStrictMode: true,
  
  // Optimize bundle splitting
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    // Enable SWC minification for better performance
    styledComponents: true,
  },
  
  // Image optimization with blur placeholders
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh4.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh5.googleusercontent.com' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
      { protocol: 'https', hostname: 'scontent.xx.fbcdn.net' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
    ],
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material', 'react-icons', 'lucide-react'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Production optimizations
  compress: true, // Enable gzip compression
  
  // Optimize loading speed
  poweredByHeader: false,
  
  // Production build optimizations
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundle
  
  // Output configuration
  output: 'standalone', // Optimize for deployment
  
  // Optimize chunk loading
  webpack: (config, { isServer, dev }) => {
    // Only optimize in production
    if (!dev && !isServer) {
      // Optimize client-side bundle
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // MUI chunk (heavy library)
            mui: {
              name: 'mui',
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
            // React chunk
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              chunks: 'all',
              priority: 40,
              reuseExistingChunk: true,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
        moduleIds: 'deterministic',
        runtimeChunk: {
          name: 'runtime',
        },
      };
    }
    
    // Tree shaking for unused exports
    config.optimization.usedExports = true;
    
    return config;
  },
  
  // Headers for better performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // API route optimizations with CDN caching
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=120',
          },
        ],
      },
      // Static assets with long-term caching
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirects for performance
  async redirects() {
    return [
      // Add any redirects here if needed
    ];
  },
  
  // Rewrites for cleaner URLs
  async rewrites() {
    return [
      // Add any rewrites here if needed
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
