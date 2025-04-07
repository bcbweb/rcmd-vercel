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
    domains: [
      "www.google.com",
      "favicon.ico",
      "icons.duckduckgo.com",
      "icon.horse",
      "t0.gstatic.com",
      "t1.gstatic.com",
      "t2.gstatic.com",
      "t3.gstatic.com",
    ],
    remotePatterns: [
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
    ],
  },
};

module.exports = nextConfig;
