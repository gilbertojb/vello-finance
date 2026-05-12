import type { NextConfig } from 'next'

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : ''

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: 'https', hostname: supabaseHostname }]
      : [],
  },
  allowedDevOrigins: ['*.localhost'],
}

export default nextConfig
