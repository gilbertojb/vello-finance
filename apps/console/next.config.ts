import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iryznaudgclqbgcpbzle.supabase.co',
      },
    ],
  },
  allowedDevOrigins: ['zp-pay.vellofinance.com.br'],
}

export default nextConfig
