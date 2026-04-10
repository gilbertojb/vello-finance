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
}

export default nextConfig
