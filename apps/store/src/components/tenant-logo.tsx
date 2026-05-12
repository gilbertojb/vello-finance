import Image from 'next/image'

type Props = {
  url:    string
  alt:    string
  width?: number
  height?: number
  className?: string
}

export async function TenantLogo({ url, alt, width = 120, height = 36, className }: Props) {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const contentType = res.headers.get('content-type') ?? ''

    if (contentType.includes('svg')) {
      const raw = await res.text()
      const svg = raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      return (
        <span
          role="img"
          aria-label={alt}
          className={className}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )
    }
  } catch {
    // queda silenciosa para o fallback
  }

  return <Image src={url} alt={alt} width={width} height={height} className={className} unoptimized />
}
