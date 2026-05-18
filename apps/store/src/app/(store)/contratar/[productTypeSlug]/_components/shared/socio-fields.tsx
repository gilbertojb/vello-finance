'use client'

import { StoreInput as Input } from '@/components/ui/store-input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type SocioData = {
  nome: string
  cpf: string
  rg?: string
  dataNascimento: string
  email: string
  whatsapp: string
  estadoCivil?: 'solteiro' | 'casado' | 'outros'
  conjuge?: {
    nome: string
    cpf: string
    dataNascimento: string
    email: string
    whatsapp: string
  }
}

type Props = {
  value: SocioData[]
  onChange: (socios: SocioData[]) => void
  withRg?: boolean
  withEstadoCivil?: boolean
  label?: string
}

const EMPTY_SOCIO: SocioData = {
  nome: '', cpf: '', rg: '', dataNascimento: '', email: '', whatsapp: '', estadoCivil: 'solteiro',
}

function isOver70(dateStr: string): boolean {
  if (!dateStr) return false
  const birth = new Date(dateStr)
  const age = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  return age >= 70
}

export function SocioFields({ value, onChange, withRg = false, withEstadoCivil = true, label = 'Dados dos Sócios' }: Props) {
  function updateSocio(index: number, patch: Partial<SocioData>) {
    onChange(value.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function setCount(n: number) {
    onChange(Array.from({ length: n }, (_, i) => value[i] ?? { ...EMPTY_SOCIO }))
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Quantidade de sócios <span className="text-destructive">*</span></FieldLabel>
        <Select value={String(value.length || '')} onValueChange={(v) => setCount(Number(v))}>
          <SelectTrigger className="w-full h-11 rounded-lg">
            <SelectValue placeholder="Selecione…" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>{n} sócio{n > 1 ? 's' : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {value.map((socio, i) => (
        <div key={i} className="space-y-4 rounded-lg border p-4">
          <p className="text-sm font-bold">
            {value.length > 1 ? `${i + 1}º Sócio` : label}
          </p>

          <Field>
            <FieldLabel>Nome completo <span className="text-destructive">*</span></FieldLabel>
            <Input placeholder="Nome completo" value={socio.nome}
              onChange={(e) => updateSocio(i, { nome: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>CPF <span className="text-destructive">*</span></FieldLabel>
              <Input inputMode="numeric" placeholder="000.000.000-00" value={socio.cpf}
                onChange={(e) => updateSocio(i, { cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })} />
            </Field>
            {withRg && (
              <Field>
                <FieldLabel>RG <span className="text-destructive">*</span></FieldLabel>
                <Input placeholder="RG" value={socio.rg ?? ''}
                  onChange={(e) => updateSocio(i, { rg: e.target.value })} />
              </Field>
            )}
          </div>

          <Field>
            <FieldLabel>Data de nascimento <span className="text-destructive">*</span></FieldLabel>
            <Input type="date" value={socio.dataNascimento}
              onChange={(e) => updateSocio(i, { dataNascimento: e.target.value })} />
            {isOver70(socio.dataNascimento) && (
              <p className="text-xs text-destructive">
                Esta operação não está disponível para pessoas com 70 anos ou mais.
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>E-mail <span className="text-destructive">*</span></FieldLabel>
            <Input type="email" placeholder="email@empresa.com" value={socio.email}
              onChange={(e) => updateSocio(i, { email: e.target.value })} />
          </Field>

          <Field>
            <FieldLabel>WhatsApp <span className="text-destructive">*</span></FieldLabel>
            <Input type="tel" placeholder="+55 (11) 99999-9999" value={socio.whatsapp}
              onChange={(e) => updateSocio(i, { whatsapp: e.target.value.replace(/\D/g, '') })} />
          </Field>

          {withEstadoCivil && (
            <>
              <Field>
                <FieldLabel>Estado civil <span className="text-destructive">*</span></FieldLabel>
                <Select
                  value={socio.estadoCivil ?? 'solteiro'}
                  onValueChange={(v) => updateSocio(i, { estadoCivil: v as SocioData['estadoCivil'] })}
                >
                  <SelectTrigger className="w-full h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {socio.estadoCivil === 'casado' && (
                <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-muted-foreground">Dados do cônjuge</p>
                  {(() => {
                    const base = { nome: '', cpf: '', dataNascimento: '', email: '', whatsapp: '' }
                    const c = { ...base, ...socio.conjuge }
                    const patch = (field: keyof typeof base, value: string) =>
                      updateSocio(i, { conjuge: { ...c, [field]: value } })
                    return (
                      <>
                        <Field>
                          <FieldLabel>Nome completo <span className="text-destructive">*</span></FieldLabel>
                          <Input placeholder="Nome" value={c.nome} onChange={(e) => patch('nome', e.target.value)} />
                        </Field>
                        <Field>
                          <FieldLabel>CPF <span className="text-destructive">*</span></FieldLabel>
                          <Input inputMode="numeric" placeholder="000.000.000-00" value={c.cpf}
                            onChange={(e) => patch('cpf', e.target.value.replace(/\D/g, '').slice(0, 11))} />
                        </Field>
                        <Field>
                          <FieldLabel>Data de nascimento <span className="text-destructive">*</span></FieldLabel>
                          <Input type="date" value={c.dataNascimento} onChange={(e) => patch('dataNascimento', e.target.value)} />
                        </Field>
                        <Field>
                          <FieldLabel>E-mail <span className="text-destructive">*</span></FieldLabel>
                          <Input type="email" placeholder="email@example.com" value={c.email} onChange={(e) => patch('email', e.target.value)} />
                        </Field>
                        <Field>
                          <FieldLabel>WhatsApp <span className="text-destructive">*</span></FieldLabel>
                          <Input type="tel" placeholder="+55 (11) 99999-9999" value={c.whatsapp}
                            onChange={(e) => patch('whatsapp', e.target.value.replace(/\D/g, ''))} />
                        </Field>
                      </>
                    )
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </FieldGroup>
  )
}
