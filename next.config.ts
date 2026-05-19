import type { NextConfig } from 'next';

// Guard parallel build features behind an opt-in env to avoid errors
// when build workers are not available in the current environment.
// Enable by setting NEXT_ENABLE_PARALLEL=1 in environments that support it.
const enableParallel = process.env.NEXT_ENABLE_PARALLEL === '1';
const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Enable production optimizations
  reactStrictMode: true,
  
  // Disable caching in development for fresh changes on refresh
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: process.env.NODE_ENV === 'production' ? 60 * 1000 : 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: process.env.NODE_ENV === 'production' ? 5 : 2,
  },
  
  // Use a custom dist dir to avoid Windows EPERM issues on .next/trace
  // Can be overridden via NEXT_DIST_DIR if needed
  // Use default .next to avoid EPERM trace file in custom dir with spaces in path on Windows
  distDir: process.env.NEXT_DIST_DIR || '.next',
  
  // Optimize bundle splitting and minification
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // SWC minification is default in Next 15; explicit flag removed
  
  // Image optimization with aggressive settings
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 0,
    dangerouslyAllowSVG: true,
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
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '5000', pathname: '/**' },
    ],
  },
  
  // Advanced performance optimizations
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material', 'lucide-react', 'react-icons'],
    // Parallel server compiles/traces can only be used when build workers are available.
    // Default to disabled to avoid build-time errors on platforms without workers.
    parallelServerCompiles: enableParallel,
    parallelServerBuildTraces: enableParallel,
  },

  // Production optimizations
  compress: true, // Enable gzip compression
  // Don't block production builds on ESLint errors (they'll still show in CI/dev)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optionally allow production builds to succeed even if there are TypeScript errors
  typescript: {
    // Root fix: do not ignore TS errors; surface them for real fixes
    ignoreBuildErrors: false,
  },
  
  // Optimize loading speed
  poweredByHeader: false,
  
  // Generate static error pages
  generateEtags: false,
  
  // Output optimization
  output: 'standalone', // Optimize for deployment
  // Removed dynamic outputFileTracing override (unsupported key warning)
  
  // Optimize chunk loading with advanced webpack config
  webpack: (config, { isServer, dev }) => {
    // Performance optimizations
    config.performance = {
      ...config.performance,
      maxAssetSize: 512000, // 500 KiB
      maxEntrypointSize: 512000,
      hints: dev ? false : 'warning',
    };
    
    if (!isServer) {
      // Optimize client-side bundle
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // MUI components in separate chunk
            mui: {
              name: 'mui',
              test: /node_modules[\\/]@mui/,
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
            // React ecosystem
            react: {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)/,
              chunks: 'all',
              priority: 40,
              reuseExistingChunk: true,
            },
            // Redux
            redux: {
              name: 'redux',
              test: /node_modules[\\/](@reduxjs|react-redux)/,
              chunks: 'all',
              priority: 35,
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
      };
      
      // Tree shaking for production
      if (!dev) {
        config.optimization.usedExports = true;
        config.optimization.sideEffects = true;
      }
    }
    
    return config;
  },
  
  // Headers for better performance and security
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
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
          // HTML/doc responses: revalidate quickly in prod; disable cache in dev for easier debugging.
          ...(isProd
            ? [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }]
            : [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' }]),
        ],
      },
      // Static Next.js assets should be aggressively cached in production.
      {
        source: '/_next/static/:path*',
        headers: [
          ...(isProd
            ? [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
            : [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' }]),
        ],
      },
      // Public assets (images/icons) can also be cached in production.
      {
        source: '/assets/:path*',
        headers: [
          ...(isProd
            ? [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
            : [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' }]),
        ],
      },
      // Keep API routes non-cached by default.
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
