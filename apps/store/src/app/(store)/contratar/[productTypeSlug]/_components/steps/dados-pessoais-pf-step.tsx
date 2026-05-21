'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StoreButton as Button } from '@/components/ui/store-button'
import { StoreInput as Input } from '@/components/ui/store-input'
import { StorePhoneInput } from '@/components/ui/store-phone-input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { saveStep } from '@/app/(store)/contratar/actions'
import { isValidCPF, calcAge, getStepData } from './types'
import type { WizardStepProps } from './types'

type Conjuge = { nome: string; cpf: string; nascimento: string; email: string; whatsapp: string }

type Props = WizardStepProps & {
  nextStep: string
  withNomeMae?: boolean
  withEstadoCivil?: boolean
}

export function DadosPessoaisPFStep({ proposalId, proposal, nextStep, withNomeMae, withEstadoCivil }: Props) {
  const saved = getStepData<Record<string, string>>(proposal, 'dados-pessoais')
  const [nome, setNome] = useState(saved.nome ?? proposal?.client_name ?? '')
  const [cpf, setCpf] = useState(saved.cpf ?? '')
  const [nascimento, setNascimento] = useState(saved.nascimento ?? '')
  const [email, setEmail] = useState(saved.email ?? '')
  const [whatsapp, setWhatsapp] = useState(saved.whatsapp ?? proposal?.client_phone ?? '')
  const [nomeMae, setNomeMae] = useState(saved.nomeMae ?? '')
  const [estadoCivil, setEstadoCivil] = useState(saved.estadoCivil ?? 'solteiro')
  const [conjuge, setConjuge] = useState<Conjuge>({ nome: '', cpf: '', nascimento: '', email: '', whatsapp: '' })
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const ageBlock = nascimento ? calcAge(nascimento) >= 70 : false

  function handleSubmit() {
    if (!proposalId) return
    if (nome.trim().split(' ').length < 2) return setError('Informe o nome completo (mínimo 2 palavras).')
    if (!isValidCPF(cpf)) return setError('CPF inválido.')
    if (ageBlock) return setError('Operação indisponível para maiores de 70 anos.')
    if (!email) return setError('E-mail obrigatório.')
    if (withNomeMae && nomeMae.trim().split(' ').length < 2) return setError('Informe o nome completo da mãe.')
    setError('')
    const data: Record<string, unknown> = { nome, cpf, nascimento, email, whatsapp }
    if (withNomeMae) data.nomeMae = nomeMae
    if (withEstadoCivil) { data.estadoCivil = estadoCivil; if (estadoCivil === 'casado') data.conjuge = conjuge }
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'dados-pessoais', stepData: data, nextStep })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <FieldGroup>
      <p className="text-sm text-muted-foreground">
        Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente.
      </p>

      <Field>
        <FieldLabel>Nome completo <span className="text-destructive">*</span></FieldLabel>
        <Input placeholder="Seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>CPF <span className="text-destructive">*</span></FieldLabel>
          <Input inputMode="numeric" placeholder="000.000.000-00" value={cpf}
            onChange={(e) => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))} />
        </Field>
        <Field>
          <FieldLabel>Nascimento <span className="text-destructive">*</span></FieldLabel>
          <Input type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
          {ageBlock && <FieldError>Operação indisponível para ≥ 70 anos.</FieldError>}
        </Field>
      </div>

      <Field>
        <FieldLabel>E-mail <span className="text-destructive">*</span></FieldLabel>
        <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>

      <Field>
        <FieldLabel>WhatsApp <span className="text-destructive">*</span></FieldLabel>
        <StorePhoneInput value={whatsapp} onChange={setWhatsapp} />
      </Field>

      {withNomeMae && (
        <Field>
          <FieldLabel>Nome da mãe <span className="text-destructive">*</span></FieldLabel>
          <Input placeholder="Nome completo da mãe" value={nomeMae} onChange={(e) => setNomeMae(e.target.value)} />
        </Field>
      )}

      {withEstadoCivil && (
        <>
          <Field>
            <FieldLabel>Estado civil <span className="text-destructive">*</span></FieldLabel>
            <Select value={estadoCivil} onValueChange={setEstadoCivil}>
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

          {estadoCivil === 'casado' && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-muted-foreground">Dados do cônjuge</p>
              {(['nome', 'cpf', 'nascimento', 'email', 'whatsapp'] as const).map((f) => (
                <Field key={f}>
                  <FieldLabel>
                    {f === 'nome' ? 'Nome completo' : f === 'cpf' ? 'CPF' : f === 'nascimento' ? 'Nascimento' : f === 'email' ? 'E-mail' : 'WhatsApp'}
                    {' '}<span className="text-destructive">*</span>
                  </FieldLabel>
                  {f === 'whatsapp' ? (
                    <StorePhoneInput value={conjuge[f]} onChange={(v) => setConjuge((p) => ({ ...p, [f]: v }))} />
                  ) : (
                    <Input
                      type={f === 'nascimento' ? 'date' : f === 'email' ? 'email' : 'text'}
                      value={conjuge[f]}
                      onChange={(e) => setConjuge((p) => ({ ...p, [f]: e.target.value }))}
                    />
                  )}
                </Field>
              ))}
            </div>
          )}
        </>
      )}

      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending || ageBlock}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}
