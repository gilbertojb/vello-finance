import Image from 'next/image'

import logo from '@/assets/logo.svg'

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="grid min-h-svh lg:grid-cols-3">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Image src={logo} alt="" width={120} height={32} loading="eager" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          {children}
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block col-span-2">
        <div className="bg-[url('/img/pattern.png')] bg-contain absolute inset-0 h-full w-full dark:brightness-[0.2] dark:grayscale" />
      </div>
    </div>
  )
}
