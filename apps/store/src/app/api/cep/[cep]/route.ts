import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cep: string }> },
) {
  const { cep } = await params
  const digits = cep.replace(/\D/g, '')

  if (digits.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
    }

    const data = (await res.json()) as {
      erro?: boolean
      logradouro: string
      bairro: string
      localidade: string
      uf: string
    }

    if (data.erro) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao consultar CEP' }, { status: 500 })
  }
}
