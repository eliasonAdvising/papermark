function prepareRemotePatterns() {
  let patterns = [
    { protocol: "https", hostname: "assets.papermark.io" },
    { protocol: "https", hostname: "cdn.papermarkassets.com" },
    { protocol: "https", hostname: "d2kgph70pw5d9n.cloudfront.net" },
    { protocol: "https", hostname: "pbs.twimg.com" },
    { protocol: "https", hostname: "media.licdn.com" },
    { protocol: "https", hostname: "lh3.googleusercontent.com" },
    { protocol: "https", hostname: "www.papermark.io" },
    { protocol: "https", hostname: "app.papermark.io" },
    { protocol: "https", hostname: "www.papermark.com" },
    { protocol: "https", hostname: "app.papermark.com" },
    { protocol: "https", hostname: "faisalman.github.io" },
    { protocol: "https", hostname: "d36r2enbzam0iu.cloudfront.net" },
    { protocol: "https", hostname: "d35vw2hoyyl88.cloudfront.net" },
  ];

  if (process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST) {
    patterns.push({
      protocol: "https",
      hostname: process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST,
    });
  }

  if (process.env.NEXT_PRIVATE_ADVANCED_UPLOAD_DISTRIBUTION_HOST) {
    patterns.push({
      protocol: "https",
      hostname: process.env.NEXT_PRIVATE_ADVANCED_UPLOAD_DISTRIBUTION_HOST,
    });
  }

  if (process.env.VERCEL_ENV === "production") {
    patterns.push({
      protocol: "https",
      hostname: "yoywvlh29jppecbh.public.blob.vercel-storage.com",
    });
  }

  if (process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development") {
    patterns.push({
      protocol: "https",
      hostname: "36so9a8uzykxknsu.public.blob.vercel-storage.com",
    });
  }

  return patterns;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
  images: {
    minimumCacheTTL: 2592000,
    remotePatterns: prepareRemotePatterns(),
  },
  skipTrailingSlashRedirect: true,
  output: 'standalone',
  async redirects() {
    const redirects = [
      {
        source: "/view/cm2xiaxzo000d147xszm9q72o",
        destination: "/view/cm34cqqqx000212oekj9upn8o",
        permanent: false,
      },
      {
        source: "/view/cm5morpmg000btdwrlahi7f2y", 
        destination: "/view/cm68iygxd0005wuf5svbr6c1x",
        permanent: false,
      },
      {
        source: "/settings",
        destination: "/settings/general",
        permanent: false,
      },
    ];

    if (process.env.NEXT_PUBLIC_APP_BASE_HOST) {
      redirects.unshift({
        source: "/",
        destination: "/dashboard",
        permanent: false,
        has: [
          {
            type: "host",
            value: process.env.NEXT_PUBLIC_APP_BASE_HOST,
          },
        ],
      });
    }

    return redirects;
  },
  experimental: {
    outputFileTracingIncludes: {
      "/api/mupdf/*": ["./node_modules/mupdf/dist/*.wasm"],
    },
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
