# Contratação — Shared Etapa 1 Steps

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **NOTE UI:** Use `frontend-design` skill before implementing step components.

**Goal:** Tipos compartilhados + 8 componentes de step Etapa 1 reutilizados entre múltiplos produtos.

**Architecture:** `WizardStepProps` em `types.ts`. Steps recebem props específicas (`nextStep`, `withEstadoCivil`, etc.) e chamam `saveStep` / `createProposal`. BlockMessage exibe bloqueio inline.

**Tech Stack:** Next.js 15, TypeScript, Tailwind, `useState` + `useTransition`.

**Specs:** `docs/features/store/contratar/ARCHITECTURE.md` + specs por produto.

---

### Task 1: `types.ts` + `block-message.tsx`

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/steps/types.ts`
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/steps/block-message.tsx`

- [ ] **Step 1: Criar `types.ts`**

```typescript
import type { ProposalWithProduct } from '../../../../queries'

export type WizardStepProps = {
  proposalId: string | null
  productId: string | null
  productTypeSlug: string
  simulationId: string | null
  proposal: ProposalWithProduct | null
}

export type ProductWizardProps = WizardStepProps & { currentStep: string }

export const inputCls = 'w-full rounded-2xl border border-surface-foreground/15 bg-background px-5 py-4 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20'
export const labelCls = 'mb-1.5 block text-sm font-semibold text-surface-foreground'
export const selectCls = `${inputCls} appearance-none`
export const btnCls = 'w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40'

export function parseBRL(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')) || 0
}
export function formatBRL(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
export function isValidCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  const calc = (len: number) => {
    let s = 0
    for (let i = 0; i < len; i++) s += +d[i] * (len + 1 - i)
    const r = 11 - (s % 11); return r >= 10 ? 0 : r
  }
  return calc(9) === +d[9] && calc(10) === +d[10]
}
export function calcAge(dateStr: string): number {
  const b = new Date(dateStr), t = new Date()
  let age = t.getFullYear() - b.getFullYear()
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--
  return age
}
export function formData<T extends Record<string, unknown>>(proposal: WizardStepProps['proposal'], step: string): T {
  return ((proposal?.form_data as Record<string, unknown>)?.[step] ?? {}) as T
}
```

- [ ] **Step 2: Criar `block-message.tsx`**

```tsx
export function BlockMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-5">
      <p className="text-sm font-medium text-destructive">{message}</p>
      <a href="/" className="mt-3 inline-block text-sm font-semibold text-primary">Ver outros produtos →</a>
    </div>
  )
}
```

- [ ] **Step 3: Verificar compilação**

```bash
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | grep "steps/types"
```

- [ ] **Step 4: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): tipos e utilitários compartilhados dos steps"
```

---

### Task 2: `retorno-step.tsx`

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/steps/retorno-step.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { finalizeEtapa1 } from '../../../actions'
import { btnCls } from './types'
import type { WizardStepProps } from './types'

type Props = WizardStepProps & { message: string }

export function RetornoStep({ proposalId, message }: Props) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    if (!proposalId) return
    startTransition(async () => {
      const res = await finalizeEtapa1(proposalId)
      if (res && 'error' in res) setError(res.error)
      else setDone(true)
    })
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <p className="text-base leading-relaxed text-surface-foreground/70">{message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-surface-foreground/12 bg-surface-foreground/3 p-5">
        <p className="text-sm text-surface-foreground/60">
          Seus dados foram salvos. Clique em confirmar para finalizar a etapa de qualificação.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleConfirm} disabled={isPending} className={btnCls}>
        {isPending ? 'Confirmando…' : 'Confirmar'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): RetornoStep compartilhado"
```

---

### Task 3: `dados-pessoais-pf-step.tsx`

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/steps/dados-pessoais-pf-step.tsx`

Usado em: `home_equity` (withEstadoCivil), `auto_equity` (withNomeMae), `financiamento_veiculo` (withNomeMae).

- [ ] **Step 1: Criar o componente**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { saveStep } from '../../../actions'
import { inputCls, labelCls, selectCls, btnCls, isValidCPF, calcAge, formData } from './types'
import type { WizardStepProps } from './types'

type Conjuge = { nome: string; cpf: string; nascimento: string; email: string; whatsapp: string }
type Props = WizardStepProps & {
  nextStep: string
  withNomeMae?: boolean
  withEstadoCivil?: boolean
}

export function DadosPessoaisPFStep({ proposalId, productTypeSlug, proposal, nextStep, withNomeMae, withEstadoCivil }: Props) {
  const saved = formData<Record<string, string>>(proposal, 'dados-pessoais')
  const [nome, setNome] = useState(saved.nome ?? (proposal?.client_name ?? ''))
  const [cpf, setCpf] = useState(saved.cpf ?? '')
  const [nascimento, setNascimento] = useState(saved.nascimento ?? '')
  const [email, setEmail] = useState(saved.email ?? '')
  const [whatsapp, setWhatsapp] = useState(saved.whatsapp ?? (proposal?.client_phone ?? ''))
  const [nomeMae, setNomeMae] = useState(saved.nomeMae ?? '')
  const [estadoCivil, setEstadoCivil] = useState(saved.estadoCivil ?? 'solteiro')
  const [conjuge, setConjuge] = useState<Conjuge>({ nome: '', cpf: '', nascimento: '', email: '', whatsapp: '' })
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const ageBlock = nascimento && calcAge(nascimento) >= 70

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
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-surface-foreground/60">
        Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente.
      </p>

      <div>
        <label className={labelCls}>Nome completo *</label>
        <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>CPF *</label>
          <input type="text" inputMode="numeric" value={cpf} onChange={e => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="000.000.000-00" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Nascimento *</label>
          <input type="date" value={nascimento} onChange={e => setNascimento(e.target.value)} className={inputCls} />
          {ageBlock && <p className="mt-1 text-xs text-destructive">Operação indisponível para ≥ 70 anos.</p>}
        </div>
      </div>

      <div>
        <label className={labelCls}>E-mail *</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>WhatsApp *</label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-3 text-sm font-medium text-surface-foreground/40">+55</span>
          <div className="h-5 w-px bg-surface-foreground/12" />
          <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))} placeholder="(11) 99999-9999" className="flex-1 bg-transparent py-4 pl-3 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none" />
        </div>
      </div>

      {withNomeMae && (
        <div>
          <label className={labelCls}>Nome da mãe *</label>
          <input type="text" value={nomeMae} onChange={e => setNomeMae(e.target.value)} placeholder="Nome completo da mãe" className={inputCls} />
        </div>
      )}

      {withEstadoCivil && (
        <>
          <div>
            <label className={labelCls}>Estado civil *</label>
            <div className="relative">
              <select value={estadoCivil} onChange={e => setEstadoCivil(e.target.value)} className={selectCls}>
                <option value="solteiro">Solteiro(a)</option>
                <option value="casado">Casado(a)</option>
                <option value="outros">Outros</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
            </div>
          </div>
          {estadoCivil === 'casado' && (
            <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/3 p-4">
              <p className="text-sm font-semibold text-surface-foreground/70">Dados do cônjuge</p>
              {(['nome', 'cpf', 'nascimento', 'email', 'whatsapp'] as const).map(f => (
                <div key={f}>
                  <label className={labelCls}>{f === 'nome' ? 'Nome completo' : f === 'cpf' ? 'CPF' : f === 'nascimento' ? 'Nascimento' : f === 'email' ? 'E-mail' : 'WhatsApp'} *</label>
                  <input type={f === 'nascimento' ? 'date' : f === 'email' ? 'email' : 'text'} value={conjuge[f]} onChange={e => setConjuge(p => ({ ...p, [f]: e.target.value }))} className={inputCls} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending || !!ageBlock} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): DadosPessoaisPFStep compartilhado"
```

---

### Task 4: `renda-ocupacao-step.tsx`

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/steps/renda-ocupacao-step.tsx`

Usado em: `home_equity`, `auto_equity`, `financiamento_veiculo`.

- [ ] **Step 1: Criar o componente**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { saveStep } from '../../../actions'
import { inputCls, labelCls, selectCls, btnCls, parseBRL, formatBRL, formData } from './types'
import type { WizardStepProps } from './types'

const OCUPACOES = ['CLT', 'Autônomo', 'Empresário', 'Aposentado', 'Servidor Público']
const TEMPOS = ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos']

type Props = WizardStepProps & { nextStep: string }

export function RendaOcupacaoStep({ proposalId, proposal, nextStep }: Props) {
  const saved = formData<Record<string, string>>(proposal, 'renda-ocupacao')
  const [ocupacao, setOcupacao] = useState(saved.ocupacao ?? '')
  const [profissao, setProfissao] = useState(saved.profissao ?? '')
  const [rendaStr, setRendaStr] = useState(saved.renda ? formatBRL(Number(saved.renda)) : '')
  const [tempo, setTempo] = useState(saved.tempo ?? '')
  const [empresa, setEmpresa] = useState(saved.empresa ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!ocupacao || !rendaStr || !tempo) return setError('Preencha todos os campos obrigatórios.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({
        proposalId: proposalId!,
        stepSlug: 'renda-ocupacao',
        stepData: { ocupacao, profissao, renda: parseBRL(rendaStr), tempo, empresa },
        nextStep,
      })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Tipo de ocupação *</label>
        <div className="relative">
          <select value={ocupacao} onChange={e => setOcupacao(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {OCUPACOES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>

      {ocupacao === 'CLT' && (
        <div>
          <label className={labelCls}>Profissão</label>
          <input type="text" value={profissao} onChange={e => setProfissao(e.target.value)} placeholder="Sua profissão" className={inputCls} />
        </div>
      )}

      <div>
        <label className={labelCls}>Renda mensal *</label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/40">R$</span>
          <input type="text" inputMode="decimal" value={rendaStr}
            onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setRendaStr(formatBRL(parseInt(digits || '0') / 100)) }}
            placeholder="0,00" className="flex-1 bg-transparent py-4 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Tempo na ocupação *</label>
        <div className="relative">
          <select value={tempo} onChange={e => setTempo(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {TEMPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>

      {ocupacao === 'CLT' && (
        <div>
          <label className={labelCls}>Empresa que trabalha</label>
          <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Nome da empresa" className={inputCls} />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): RendaOcupacaoStep compartilhado"
```

---

### Task 5: `dados-empresa-pj-step.tsx`

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/steps/dados-empresa-pj-step.tsx`

`variant='simple'`: razão social + CNPJ + tempo empresa (bloqueia < 3 anos) — usado em `home_equity_pj`, `auto_equity_pj`, `financiamento_imovel` (step `dados-solicitante`).
`variant='full'`: razão social + CNPJ + atividade + produtos + faturamento — usado em `capital_giro`, `antecipacao_recebiveis`.

- [ ] **Step 1: Criar o componente**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { saveStep } from '../../../actions'
import { inputCls, labelCls, selectCls, btnCls, parseBRL, formatBRL, formData } from './types'
import { BlockMessage } from './block-message'
import type { WizardStepProps } from './types'

const TEMPOS_EMPRESA = ['Menos de 3 anos', 'Mais de 3 anos']

type Props = WizardStepProps & {
  variant: 'simple' | 'full'
  nextStep: string
  stepSlug?: string
}

export function DadosEmpresaPJStep({ proposalId, proposal, variant, nextStep, stepSlug = 'dados-empresa' }: Props) {
  const saved = formData<Record<string, string>>(proposal, stepSlug)
  const [razaoSocial, setRazaoSocial] = useState(saved.razaoSocial ?? '')
  const [cnpj, setCnpj] = useState(saved.cnpj ?? '')
  const [tempoEmpresa, setTempoEmpresa] = useState(saved.tempoEmpresa ?? '')
  const [atividade, setAtividade] = useState(saved.atividade ?? '')
  const [produtos, setProdutos] = useState(saved.produtos ?? '')
  const [faturamentoStr, setFaturamentoStr] = useState(saved.faturamento ? formatBRL(Number(saved.faturamento)) : '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const blockTempo = variant === 'simple' && tempoEmpresa === 'Menos de 3 anos'

  function handleSubmit() {
    if (blockTempo) return
    if (!razaoSocial || !cnpj) return setError('Razão Social e CNPJ são obrigatórios.')
    setError('')
    const data: Record<string, unknown> = { razaoSocial, cnpj }
    if (variant === 'simple') data.tempoEmpresa = tempoEmpresa
    else { data.atividade = atividade; data.produtos = produtos; data.faturamento = parseBRL(faturamentoStr) }
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug, stepData: data, nextStep })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-surface-foreground/60">
        Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente.
      </p>

      <div>
        <label className={labelCls}>Razão Social *</label>
        <input type="text" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="Razão Social da empresa" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>CNPJ *</label>
        <input type="text" inputMode="numeric" value={cnpj} onChange={e => setCnpj(e.target.value.replace(/\D/g, '').slice(0, 14))} placeholder="00.000.000/0001-00" className={inputCls} />
      </div>

      {variant === 'simple' && (
        <div>
          <label className={labelCls}>Tempo de empresa *</label>
          <div className="relative">
            <select value={tempoEmpresa} onChange={e => setTempoEmpresa(e.target.value)} className={selectCls}>
              <option value="" disabled>Selecione…</option>
              {TEMPOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
          </div>
          {blockTempo && <BlockMessage message="É necessário ter no mínimo 3 anos de empresa para esta linha de crédito." />}
        </div>
      )}

      {variant === 'full' && (
        <>
          <div>
            <label className={labelCls}>Atividade da empresa *</label>
            <input type="text" value={atividade} onChange={e => setAtividade(e.target.value)} placeholder="Descreva a atividade" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Produtos ou serviços oferecidos</label>
            <input type="text" value={produtos} onChange={e => setProdutos(e.target.value)} placeholder="Descreva seus produtos/serviços" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Faturamento anual *</label>
            <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
              <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/40">R$</span>
              <input type="text" inputMode="decimal" value={faturamentoStr}
                onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setFaturamentoStr(formatBRL(parseInt(digits || '0') / 100)) }}
                placeholder="0,00" className="flex-1 bg-transparent py-4 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none" />
            </div>
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending || blockTempo} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): DadosEmpresaPJStep compartilhado"
```

---

### Task 6: `atividade-faturamento-step.tsx`

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/steps/atividade-faturamento-step.tsx`

Usado em `home_equity_pj` (faturamento anual), `auto_equity_pj` (faturamento mensal), `financiamento_imovel` (com produtos).

- [ ] **Step 1: Criar o componente**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { saveStep } from '../../../actions'
import { inputCls, labelCls, btnCls, parseBRL, formatBRL, formData } from './types'
import type { WizardStepProps } from './types'

type Props = WizardStepProps & {
  nextStep: string
  faturamentoLabel?: string
  hasProdutos?: boolean
}

export function AtividadeFaturamentoStep({ proposalId, proposal, nextStep, faturamentoLabel = 'Faturamento anual', hasProdutos }: Props) {
  const saved = formData<Record<string, string>>(proposal, 'atividade-faturamento')
  const [atividade, setAtividade] = useState(saved.atividade ?? '')
  const [faturamentoStr, setFaturamentoStr] = useState(saved.faturamento ? formatBRL(Number(saved.faturamento)) : '')
  const [produtos, setProdutos] = useState(saved.produtos ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!atividade || !faturamentoStr) return setError('Preencha todos os campos obrigatórios.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({
        proposalId: proposalId!,
        stepSlug: 'atividade-faturamento',
        stepData: { atividade, faturamento: parseBRL(faturamentoStr), produtos },
        nextStep,
      })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Atividade da empresa *</label>
        <input type="text" value={atividade} onChange={e => setAtividade(e.target.value)} placeholder="Descreva a atividade principal" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>{faturamentoLabel} *</label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/40">R$</span>
          <input type="text" inputMode="decimal" value={faturamentoStr}
            onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setFaturamentoStr(formatBRL(parseInt(digits || '0') / 100)) }}
            placeholder="0,00" className="flex-1 bg-transparent py-4 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none" />
        </div>
      </div>
      {hasProdutos && (
        <div>
          <label className={labelCls}>Produtos ou serviços</label>
          <input type="text" value={produtos} onChange={e => setProdutos(e.target.value)} placeholder="Descreva seus produtos/serviços" className={inputCls} />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): AtividadeFaturamentoStep compartilhado"
```

---

### Task 7: `dados-socios-step.tsx` + `endereco-step.tsx` + `dados-vendedor-step.tsx`

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/steps/dados-socios-step.tsx`
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/steps/endereco-step.tsx`
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/steps/dados-vendedor-step.tsx`

- [ ] **Step 1: Criar `dados-socios-step.tsx`**

Wrap do `SocioFields` com saveStep. `withRg` ativo para antecipacao_recebiveis.

```tsx
'use client'
import { useState, useTransition } from 'react'
import { saveStep } from '../../../actions'
import { btnCls, formData } from './types'
import { SocioFields } from '../shared/socio-fields'
import type { SocioData } from '../shared/socio-fields'
import type { WizardStepProps } from './types'

type Props = WizardStepProps & { nextStep: string; withRg?: boolean; withEstadoCivil?: boolean }

export function DadosSociosStep({ proposalId, proposal, nextStep, withRg, withEstadoCivil = true }: Props) {
  const saved = (formData<{ socios?: SocioData[] }>(proposal, 'dados-socios')).socios ?? []
  const [socios, setSocios] = useState<SocioData[]>(saved.length ? saved : [])
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (socios.length === 0) return setError('Informe pelo menos 1 sócio.')
    if (socios.some(s => !s.nome || !s.cpf || !s.dataNascimento || !s.email)) return setError('Preencha todos os campos dos sócios.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'dados-socios', stepData: { socios }, nextStep })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <SocioFields value={socios} onChange={setSocios} withRg={withRg} withEstadoCivil={withEstadoCivil} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Criar `endereco-step.tsx`**

Wrap do `AddressForm`. `showSameAs` lê dados do step anterior em `proposal.form_data`.

```tsx
'use client'
import { useState, useTransition } from 'react'
import { saveStep } from '../../../actions'
import { btnCls, formData } from './types'
import { AddressForm, type AddressData } from '../shared/address-form'
import type { WizardStepProps } from './types'

const EMPTY: AddressData = { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }

type Props = WizardStepProps & {
  stepSlug: string
  nextStep: string
  label: string
  showSameAs?: { label: string; sourceStepSlug: string }
}

export function EnderecoStep({ proposalId, proposal, stepSlug, nextStep, label, showSameAs }: Props) {
  const saved = formData<AddressData>(proposal, stepSlug)
  const [addr, setAddr] = useState<AddressData>({ ...EMPTY, ...saved })
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const sameAsData = showSameAs ? formData<AddressData>(proposal, showSameAs.sourceStepSlug) : undefined

  function handleSubmit() {
    if (!addr.cep || !addr.rua || !addr.numero || !addr.cidade) return setError('Preencha os campos obrigatórios do endereço.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug, stepData: addr, nextStep })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <AddressForm
        label={label}
        value={addr}
        onChange={setAddr}
        showSameAs={sameAsData && showSameAs ? { label: showSameAs.label, data: { ...EMPTY, ...sameAsData } } : undefined}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Criar `dados-vendedor-step.tsx`**

Campos do proprietário do imóvel ou veículo. `stepSlug` é `dados-vendedor` (mesmo nome em financiamento_imovel e financiamento_veiculo).

```tsx
'use client'
import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { saveStep } from '../../../actions'
import { inputCls, labelCls, selectCls, btnCls, isValidCPF, calcAge, formData } from './types'
import type { WizardStepProps } from './types'

type Conjuge = { nome: string; cpf: string; nascimento: string; email: string; whatsapp: string }
type Props = WizardStepProps & { nextStep: string; stepSlug?: string }

export function DadosVendedorStep({ proposalId, proposal, nextStep, stepSlug = 'dados-vendedor' }: Props) {
  const saved = formData<Record<string, string>>(proposal, stepSlug)
  const [nome, setNome] = useState(saved.nome ?? '')
  const [cpf, setCpf] = useState(saved.cpf ?? '')
  const [nascimento, setNascimento] = useState(saved.nascimento ?? '')
  const [email, setEmail] = useState(saved.email ?? '')
  const [whatsapp, setWhatsapp] = useState(saved.whatsapp ?? '')
  const [estadoCivil, setEstadoCivil] = useState(saved.estadoCivil ?? 'solteiro')
  const [conjuge, setConjuge] = useState<Conjuge>({ nome: '', cpf: '', nascimento: '', email: '', whatsapp: '' })
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const ageBlock = nascimento && calcAge(nascimento) >= 70

  function handleSubmit() {
    if (!proposalId) return
    if (nome.trim().split(' ').length < 2) return setError('Informe o nome completo (mínimo 2 palavras).')
    if (!isValidCPF(cpf)) return setError('CPF inválido.')
    if (ageBlock) return setError('Operação indisponível para maiores de 70 anos.')
    setError('')
    const data: Record<string, unknown> = { nome, cpf, nascimento, email, whatsapp, estadoCivil }
    if (estadoCivil === 'casado') data.conjuge = conjuge
    startTransition(async () => {
      const res = await saveStep({ proposalId, stepSlug, stepData: data, nextStep })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-surface-foreground/60">
        Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente.
      </p>
      <div>
        <label className={labelCls}>Nome completo *</label>
        <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo do vendedor" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>CPF *</label>
          <input type="text" inputMode="numeric" value={cpf} onChange={e => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="000.000.000-00" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Nascimento *</label>
          <input type="date" value={nascimento} onChange={e => setNascimento(e.target.value)} className={inputCls} />
          {ageBlock && <p className="mt-1 text-xs text-destructive">Operação indisponível para ≥ 70 anos.</p>}
        </div>
      </div>
      <div>
        <label className={labelCls}>E-mail *</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@email.com" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>WhatsApp *</label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-3 text-sm font-medium text-surface-foreground/40">+55</span>
          <div className="h-5 w-px bg-surface-foreground/12" />
          <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))} placeholder="(11) 99999-9999" className="flex-1 bg-transparent py-4 pl-3 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Estado civil *</label>
        <div className="relative">
          <select value={estadoCivil} onChange={e => setEstadoCivil(e.target.value)} className={selectCls}>
            <option value="solteiro">Solteiro(a)</option>
            <option value="casado">Casado(a)</option>
            <option value="outros">Outros</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>
      {estadoCivil === 'casado' && (
        <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/3 p-4">
          <p className="text-sm font-semibold text-surface-foreground/70">Dados do cônjuge do vendedor</p>
          {(['nome', 'cpf', 'nascimento', 'email', 'whatsapp'] as const).map(f => (
            <div key={f}>
              <label className={labelCls}>{f === 'nome' ? 'Nome completo' : f === 'cpf' ? 'CPF' : f === 'nascimento' ? 'Nascimento' : f === 'email' ? 'E-mail' : 'WhatsApp'} *</label>
              <input type={f === 'nascimento' ? 'date' : f === 'email' ? 'email' : 'text'} value={conjuge[f]} onChange={e => setConjuge(p => ({ ...p, [f]: e.target.value }))} className={inputCls} />
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending || !!ageBlock} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Verificar compilação de todos os steps**

```bash
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | grep "_components/steps"
```

Expected: sem output.

- [ ] **Step 5: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): DadosSociosStep, EnderecoStep, DadosVendedorStep compartilhados"
```
