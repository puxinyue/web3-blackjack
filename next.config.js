/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        esmExternals: 'loose', // 或 'all'
        // optimizeFonts: false,
      },
}

module.exports = nextConfig
