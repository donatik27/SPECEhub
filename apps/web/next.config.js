/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@polymarket/shared', '@polymarket/database'],
  outputFileTracingIncludes: {
    '/api/**/*': ['../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/*.node'],
  },
}

module.exports = nextConfig

