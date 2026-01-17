/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@polymarket/shared', '@polymarket/database'],
  outputFileTracing: true,
}

module.exports = nextConfig

