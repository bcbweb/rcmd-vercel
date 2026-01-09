/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    // Handle deprecated punycode module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      punycode: require.resolve("punycode"),
    };

    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Ignore .node files (native modules) - these are binary files that webpack can't process
    // They're used by metascraper dependencies like re2 and should only run server-side
    config.module.rules.push({
      test: /\.node$/,
      loader: 'ignore-loader',
    });

    // Mark native modules as externals for server-side builds
    if (isServer) {
      config.externals = config.externals || [];
      // re2 is a native module used by url-regex-safe (metascraper dependency)
      config.externals.push('re2');
    }

    return config;
  },
  // Temporarily ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Use output: 'standalone' for better compatibility with Vercel and other platforms
  output: "standalone",
  images: {
    remotePatterns: [
      // Wildcard for development environment
      ...(process.env.NODE_ENV === "development"
        ? [
            {
              protocol: "https",
              hostname: "**",
            },
            {
              protocol: "http",
              hostname: "**",
            },
          ]
        : []),
      // Essential domains - Sanity
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/**",
      },
      // Essential domains - Supabase
      {
        protocol: "https",
        hostname: "dmhigtssxgoupibxazoe.supabase.co",
        pathname: "/**",
      },
      // Supabase Storage
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Image Services
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Essential domains - Own sites
      {
        protocol: "https",
        hostname: "rcmd.bcbrown.com",
      },
      // Fallback for important metadata services
      // These are kept as they're very common and reliable sources
      {
        protocol: "https",
        hostname: "favicon.ico",
      },
      {
        protocol: "https",
        hostname: "icons.duckduckgo.com",
      },
      {
        protocol: "https",
        hostname: "icon.horse",
      },
    ],
    // Add a custom loader for more control over image optimization
    // This can help with browser compatibility issues
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // CORS headers removed - using hosted Sanity Studio instead of embedded

  // Improve image optimization handling
  experimental: {
    // Disable image optimization caching in development to catch issues early
    // isrMemoryCacheSize: process.env.NODE_ENV === "development" ? 0 : 50,
    // Use streaming for improved performance
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;
