import type { NextConfig } from 'next'

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : ''

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            dangerouslyAllowSVG: true,
            contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
          },
        ]
      : [],
  },
  allowedDevOrigins: ['*.localhost'],
}

export default nextConfig
