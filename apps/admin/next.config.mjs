/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El backend de INFI TV corre aparte (NestJS). El panel no sirve APIs propias.
  transpilePackages: ["@infitv/types", "@infitv/config", "@infitv/utils"],
};

export default nextConfig;
