/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/database"],
  output: "standalone",
};

export default nextConfig;
