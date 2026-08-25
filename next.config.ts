import type { NextConfig } from "next";

// The Capacitor shell ships the UI as a static bundle and talks to the API
// routes that stay deployed on Vercel. `npm run build:app` sets BUILD_TARGET,
// so the web deploy is unaffected by anything in this branch.
const isAppBuild = process.env.BUILD_TARGET === 'app';

const nextConfig: NextConfig = {
  // Both checks pass cleanly, and a runtime error costs far more once the app
  // ships through review than it does on the web, where a fix deploys in
  // minutes. Keep them enforcing.
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Image optimization settings
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // A static export has no server to run the image optimizer.
    unoptimized: isAppBuild,
  },
  // Optimize package imports to avoid barrel file overhead
  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js',
    ],
  },
  // Enable compression
  compress: true,
  // PoweredBy header removal for security
  poweredByHeader: false,
  // The app runs from capacitor://localhost and calls the API on this
  // deployment, which makes every request cross-origin. Without these the
  // preflight came back 204 with no allow-origin header and the browser threw
  // the call away — dream analysis, affirmations, everything, silently.
  //
  // Only the shell's own origin is allowed, so this does not open the API to
  // arbitrary websites. An Android build would need https://localhost adding.
  ...(isAppBuild
    ? {}
    : {
        async headers() {
          return [
            {
              source: '/api/:path*',
              headers: [
                { key: 'Access-Control-Allow-Origin', value: 'capacitor://localhost' },
                { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
                { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
                { key: 'Access-Control-Max-Age', value: '86400' },
                // Responses differ by origin, so caches must not share them.
                { key: 'Vary', value: 'Origin' },
              ],
            },
          ];
        },
      }),
  ...(isAppBuild
    ? {
        output: 'export' as const,
        // Capacitor serves the bundle from a local file server, which resolves
        // paths to files on disk — every route needs its own index.html.
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
