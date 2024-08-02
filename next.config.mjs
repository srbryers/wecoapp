/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config) => {
    config.externals = {
      'node:crypto': 'commonjs crypto',
      'node:querystring': 'commonjs querystring',
    };
    return config;
  },
};

export default nextConfig;
