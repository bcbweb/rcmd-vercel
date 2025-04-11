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
  images: {
    remotePatterns: [
      // Convert domains to remotePatterns
      {
        protocol: "https",
        hostname: "www.google.com",
      },
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
      {
        protocol: "https",
        hostname: "t0.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "t1.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "t2.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "t3.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "rothys.com",
      },
      // Existing remotePatterns
      {
        protocol: "https",
        hostname: "dmhigtssxgoupibxazoe.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/**",
      },
      // General pattern for external images (less restrictive for preview purposes)
      ...(process.env.NODE_ENV === "development"
        ? [
            {
              protocol: "https",
              hostname: "**",
            },
          ]
        : []),
      // Common patterns for metadata images
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.imgur.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.twimg.com",
        pathname: "/**",
      },
      // Brand and retail sites
      {
        protocol: "https",
        hostname: "*.shopify.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "*.shopify.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cdn.shopify.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.files.wordpress.com",
        pathname: "/**",
      },
      // Add a pattern for Rothys and similar ecommerce sites
      {
        protocol: "http",
        hostname: "*.com",
        pathname: "/cdn/**",
      },
      {
        protocol: "https",
        hostname: "*.com",
        pathname: "/cdn/**",
      },
    ],
  },
  // CORS headers removed - using hosted Sanity Studio instead of embedded
};

module.exports = nextConfig;
