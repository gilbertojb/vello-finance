import Image from 'next/image'
import Link from 'next/link'

const PARTNERS = [
  {
    name: 'Itaú',
    src: '/images/zp/partners/itau.png',
    width: 261,
    height: 260,
  },
  {
    name: 'Bradesco',
    src: '/images/zp/partners/bradesco.png',
    width: 634,
    height: 141,
  },
  {
    name: 'Santander',
    src: '/images/zp/partners/santander.png',
    width: 993,
    height: 173,
  },
  {
    name: 'Creditas',
    src: '/images/zp/partners/creditas.png',
    width: 836,
    height: 161,
  },
  {
    name: 'CashMe',
    src: '/images/zp/partners/cashme.png',
    width: 841,
    height: 159,
  },
]

export function PartnersSection() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/4 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Parceiros
          </span>

          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-foreground/60">
            Parceiros de confiança, oferecendo as melhores condições para você.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {PARTNERS.map((partner) => (
              <div
                key={partner.name}
                className="flex h-14 items-center justify-center rounded-xl px-6"
              >
                <Image
                  src={partner.src}
                  alt={partner.name}
                  width={partner.width}
                  height={partner.height}
                  className="h-7 w-auto object-contain"
                />
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/simulador"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              Simule seu crédito agora
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
