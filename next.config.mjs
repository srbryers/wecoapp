/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        hostname: 'cdn.shopify.com',
        protocol: 'https',
      },
    ],
  },
  // webpack: (config) => {
  //   config.externals = {
  //     'node:crypto': 'commonjs crypto',
  //     'node:querystring': 'commonjs querystring',
  //   };
  //   return config;
  // },
};

export default nextConfig;
