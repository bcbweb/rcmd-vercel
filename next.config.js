/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // Handle deprecated punycode module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      punycode: require.resolve("punycode"),
    };

    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  // Temporarily ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
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
