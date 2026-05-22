'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { StoreButton as Button } from '@/components/ui/store-button'
import { StoreInput as Input } from '@/components/ui/store-input'
import { StorePhoneInput } from '@/components/ui/store-phone-input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { createProposal, saveStep } from '@/app/(store)/contratar/actions'
import { isValidCPF, calcAge, getStepData } from '../steps/types'
import { ToggleGroup } from '../steps/toggle-group'
import { RetornoStep } from '../steps/retorno-step'
import { DadosBancariosEtapa2Step } from '../etapa2/dados-bancarios-step'
import type { ProductWizardProps } from '../steps/types'

function VideoPlayer({ url }: { url: string }) {
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/)
  const vimeoMatch = !ytMatch ? url.match(/vimeo\.com\/(\d+)/) : null

  if (ytMatch) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg aspect-video">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Vídeo explicativo"
        />
      </div>
    )
  }

  if (vimeoMatch) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg aspect-video">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          allowFullScreen
          title="Vídeo explicativo"
        />
      </div>
    )
  }

  return (
    <video className="w-full rounded-lg" controls>
      <source src={url} />
    </video>
  )
}

function BackButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-foreground/40 transition-colors hover:text-surface-foreground"
    >
      <ChevronLeft className="h-3.5 w-3.5" />
      Voltar
    </button>
  )
}

function LiberacaoSaqueStep({ proposalId, productId, productTypeSlug, simulationId, proposal, currentStep, videoUrl }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'liberacao-saque')
  const [liberou, setLiberou] = useState(saved.liberou ?? '')
  const [jaRealizei, setJaRealizei] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const podeAvancar = liberou === 'Sim' || jaRealizei
  const router = useRouter()

  function handleSubmit() {
    if (!podeAvancar) return setError('Complete a etapa antes de continuar.')
    setError('')
    startTransition(async () => {
      const stepData = { liberou: 'Sim' }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'liberacao-saque', stepData, nextStep: 'liberacao-bancos' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId: simulationId ?? undefined, stepSlug: 'liberacao-saque', stepData, nextStep: 'liberacao-bancos' })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <div className="space-y-5">
      {videoUrl && <VideoPlayer url={videoUrl} />}
      <p className="text-sm text-muted-foreground">Você já liberou o Saque Aniversário no aplicativo do FGTS (Caixa)?</p>
      <ToggleGroup options={['Sim', 'Não']} value={liberou} onChange={setLiberou} />
      {liberou === 'Não' && !jaRealizei && (
        <div className="rounded-lg border border-surface-foreground/10 bg-surface p-4 space-y-3">
          <p className="text-sm font-semibold text-surface-foreground">Como liberar o Saque Aniversário:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-surface-foreground/70">
            <li>Acesse o aplicativo <strong>Caixa FGTS</strong></li>
            <li>Vá em <strong>Saque Aniversário</strong></li>
            <li>Selecione <strong>"Optar pelo Saque Aniversário"</strong></li>
            <li>Confirme sua opção</li>
          </ol>
          <Button type="button" className="mt-2 w-full" onClick={() => setJaRealizei(true)}>
            Já realizei ✓
          </Button>
        </div>
      )}
      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending || !podeAvancar}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
      <div className="flex justify-center pt-1">
        <BackButton />
      </div>
    </div>
  )
}

function LiberacaoBancosStep({ proposalId, proposal }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'liberacao-bancos')
  const [liberou, setLiberou] = useState(saved.liberou ?? '')
  const [jaRealizei, setJaRealizei] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const podeAvancar = liberou === 'Sim' || jaRealizei

  function handleSubmit() {
    if (!podeAvancar) return setError('Complete a etapa antes de continuar.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'liberacao-bancos', stepData: { liberou: 'Sim' }, nextStep: 'verificar-margem' })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Você já autorizou os bancos a acessar seu FGTS para antecipação?</p>
      <ToggleGroup options={['Sim', 'Não']} value={liberou} onChange={setLiberou} />
      {liberou === 'Não' && !jaRealizei && (
        <div className="rounded-lg border border-surface-foreground/10 bg-surface p-4 space-y-3">
          <p className="text-sm font-semibold text-surface-foreground">Como autorizar os bancos:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-surface-foreground/70">
            <li>Acesse o <strong>app FGTS</strong> ou o site da Caixa</li>
            <li>Vá em <strong>"Autorizar bancos"</strong></li>
            <li>Procure por <strong>QI Sociedade de Crédito</strong>, <strong>CDC Sociedade de Crédito</strong> e <strong>ZIPDIN Soluções Digitais</strong></li>
            <li>Selecione cada banco parceiro</li>
            <li>Confirme a autorização</li>
          </ol>
          <Button type="button" className="mt-2 w-full" onClick={() => setJaRealizei(true)}>
            Já realizei ✓
          </Button>
        </div>
      )}
      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending || !podeAvancar}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
      <div className="flex justify-center pt-1">
        <BackButton />
      </div>
    </div>
  )
}

function VerificarMargemStep({ proposalId, proposal }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'verificar-margem')
  const [nome, setNome] = useState(saved.nome ?? (proposal?.client_name ?? ''))
  const [cpf, setCpf] = useState(saved.cpf ?? '')
  const [rg, setRg] = useState(saved.rg ?? '')
  const [nascimento, setNascimento] = useState(saved.nascimento ?? '')
  const [email, setEmail] = useState(saved.email ?? '')
  const [whatsapp, setWhatsapp] = useState(saved.whatsapp ?? (proposal?.client_phone ?? ''))
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const ageBlock = nascimento ? calcAge(nascimento) >= 70 : false
  const router = useRouter()

  function handleSubmit() {
    if (!proposalId) return
    if (nome.trim().split(' ').length < 2) return setError('Informe o nome completo.')
    if (!isValidCPF(cpf)) return setError('CPF inválido.')
    if (!rg) return setError('RG obrigatório.')
    if (ageBlock) return setError('Operação indisponível para ≥ 70 anos.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId, stepSlug: 'verificar-margem', stepData: { nome, cpf, rg, nascimento, email, whatsapp }, nextStep: 'dados-bancarios' })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <FieldGroup>
      <p className="text-sm text-muted-foreground">Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente.</p>
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
          <FieldLabel>RG <span className="text-destructive">*</span></FieldLabel>
          <Input placeholder="Número do RG" value={rg} onChange={(e) => setRg(e.target.value)} />
        </Field>
      </div>
      <Field>
        <FieldLabel>Data de nascimento <span className="text-destructive">*</span></FieldLabel>
        <Input type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
        {ageBlock && <FieldError>Operação indisponível para ≥ 70 anos.</FieldError>}
      </Field>
      <Field>
        <FieldLabel>E-mail <span className="text-destructive">*</span></FieldLabel>
        <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>WhatsApp <span className="text-destructive">*</span></FieldLabel>
        <StorePhoneInput value={whatsapp} onChange={setWhatsapp} />
      </Field>
      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending || ageBlock}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
      <div className="flex justify-center pt-1">
        <BackButton />
      </div>
    </FieldGroup>
  )
}

export function FgtsWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'liberacao-saque':
      return <LiberacaoSaqueStep {...props} currentStep={currentStep} />
    case 'liberacao-bancos':
      return <LiberacaoBancosStep {...props} currentStep={currentStep} />
    case 'verificar-margem':
      return <VerificarMargemStep {...props} currentStep={currentStep} />
    case 'dados-bancarios':
      return <DadosBancariosEtapa2Step {...props} nextStep="retorno" />
    case 'retorno':
      return <RetornoStep {...props} skipDocuments message="Recebemos seus dados e já começamos a análise! Fique de olho no WhatsApp e no e-mail." />
    default:
      return null
  }
}
