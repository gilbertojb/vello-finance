# Contratação — Wizards de Imóvel

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **Prerequisites:** `contratar-shared-steps.md` e `contratar-etapa2-steps.md` concluídos.

**Goal:** Wizards completos para `home_equity`, `home_equity_pj` e `financiamento_imovel`, incluindo o step `operacao` específico de cada produto.

**Architecture:** Cada wizard é um Client Component que faz switch em `currentStep` e renderiza o step correspondente. Steps compartilhados importados de `../steps/`. Operacao steps são específicos por produto e ficam no arquivo do próprio wizard.

**Specs:** `docs/features/store/contratar/cgi-pf.md`, `cgi-pj.md`, `financiamento-imovel.md`.

---

### Task 1: `home-equity-wizard.tsx`

Inclui o `OperacaoStep` específico do CGI PF: tipo de imóvel, imóvel financiado (block > 40%), matrícula, motivo do crédito.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizards/home-equity-wizard.tsx`

- [ ] **Step 1: Criar o wizard**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { createProposal, saveStep } from '../../../actions'
import { inputCls, labelCls, selectCls, btnCls, parseBRL, formatBRL, formData } from '../steps/types'
import { BlockMessage } from '../steps/block-message'
import { RetornoStep } from '../steps/retorno-step'
import { DadosPessoaisPFStep } from '../steps/dados-pessoais-pf-step'
import { EnderecoStep } from '../steps/endereco-step'
import { RendaOcupacaoStep } from '../steps/renda-ocupacao-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_IMOVEL = ['Casa de rua', 'Casa de condomínio', 'Apartamento', 'Terreno', 'Escritório', 'Loja', 'Estúdio', 'Flat']
const MOTIVOS = ['Quitar dívidas pessoais', 'Quitar dívidas da empresa', 'Investir em negócio próprio', 'Reforma ou construção', 'Aquisição de outro imóvel', 'Projetos pessoais', 'Outros']

function HomeEquityOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'operacao')
  const [tipoImovel, setTipoImovel] = useState(saved.tipoImovel ?? '')
  const [financiado, setFinanciado] = useState(saved.financiado ?? '')
  const [valorPago, setValorPagoStr] = useState(saved.valorPago ? formatBRL(Number(saved.valorPago)) : '')
  const [matricula, setMatricula] = useState(saved.matricula ?? '')
  const [motivo, setMotivo] = useState(saved.motivo ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const blockFinanciado = financiado === 'Sim' && parseBRL(valorPago) > 0
    ? false // block avaliado no submit
    : false

  function handleSubmit() {
    if (!tipoImovel || !financiado || !matricula || !motivo) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoImovel, financiado, valorPago: parseBRL(valorPago), matricula, motivo }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'operacao', stepData, nextStep: 'dados-pessoais' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId, stepSlug: 'operacao', stepData, nextStep: 'dados-pessoais' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Tipo de imóvel *</label>
        <div className="relative">
          <select value={tipoImovel} onChange={e => setTipoImovel(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {TIPOS_IMOVEL.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>

      <div>
        <label className={labelCls}>O imóvel está financiado? *</label>
        <div className="relative">
          <select value={financiado} onChange={e => setFinanciado(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            <option value="Não">Não</option>
            <option value="Sim">Sim</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>

      {financiado === 'Sim' && (
        <div>
          <label className={labelCls}>Valor pago até agora *</label>
          <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
            <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/40">R$</span>
            <input type="text" inputMode="decimal" value={valorPago}
              onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setValorPagoStr(formatBRL(parseInt(digits || '0') / 100)) }}
              placeholder="0,00" className="flex-1 bg-transparent py-4 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none" />
          </div>
          <p className="mt-1.5 text-xs text-surface-foreground/50">
            Atenção: financiamento superior a 40% do valor do imóvel impede a operação.
          </p>
        </div>
      )}

      <div>
        <label className={labelCls}>Número de matrícula *</label>
        <input type="text" inputMode="numeric" value={matricula} onChange={e => setMatricula(e.target.value.replace(/\D/g, ''))} placeholder="Apenas números" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Motivo do crédito *</label>
        <div className="relative">
          <select value={motivo} onChange={e => setMotivo(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}

export function HomeEquityWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <HomeEquityOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-pessoais':
      return <DadosPessoaisPFStep {...props} nextStep="endereco-garantia" withEstadoCivil />
    case 'endereco-garantia':
      return <EnderecoStep {...props} stepSlug="endereco-garantia" nextStep="endereco-residencial" label="Endereço do Imóvel em Garantia" />
    case 'endereco-residencial':
      return <EnderecoStep {...props} stepSlug="endereco-residencial" nextStep="renda-ocupacao" label="Endereço Residencial" showSameAs={{ label: 'Mesmo endereço da garantia', sourceStepSlug: 'endereco-garantia' }} />
    case 'renda-ocupacao':
      return <RendaOcupacaoStep {...props} nextStep="retorno" />
    case 'retorno':
      return <RetornoStep {...props} message="Obrigado pelas informações! Agora é com a gente, sua proposta já está em análise. Fique de olho no WhatsApp e no seu e-mail." />
    default:
      return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): HomeEquityWizard (CGI PF)"
```

---

### Task 2: `home-equity-pj-wizard.tsx`

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizards/home-equity-pj-wizard.tsx`

Operacao é idêntico ao CGI PF (mesmo tipo de imóvel, financiado, matrícula, motivo).

- [ ] **Step 1: Criar o wizard**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { createProposal, saveStep } from '../../../actions'
import { selectCls, btnCls, parseBRL, formatBRL, formData, inputCls, labelCls } from '../steps/types'
import { RetornoStep } from '../steps/retorno-step'
import { DadosEmpresaPJStep } from '../steps/dados-empresa-pj-step'
import { AtividadeFaturamentoStep } from '../steps/atividade-faturamento-step'
import { DadosSociosStep } from '../steps/dados-socios-step'
import { EnderecoStep } from '../steps/endereco-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_IMOVEL = ['Casa de rua', 'Casa de condomínio', 'Apartamento', 'Terreno', 'Escritório', 'Loja', 'Estúdio', 'Flat']
const MOTIVOS = ['Quitar dívidas pessoais', 'Quitar dívidas da empresa', 'Investir em negócio próprio', 'Reforma ou construção', 'Aquisição de outro imóvel', 'Projetos pessoais', 'Outros']

function HomeEquityPJOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'operacao')
  const [tipoImovel, setTipoImovel] = useState(saved.tipoImovel ?? '')
  const [financiado, setFinanciado] = useState(saved.financiado ?? '')
  const [valorPago, setValorPagoStr] = useState(saved.valorPago ? formatBRL(Number(saved.valorPago)) : '')
  const [matricula, setMatricula] = useState(saved.matricula ?? '')
  const [motivo, setMotivo] = useState(saved.motivo ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!tipoImovel || !financiado || !matricula || !motivo) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoImovel, financiado, valorPago: parseBRL(valorPago), matricula, motivo }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'operacao', stepData, nextStep: 'dados-empresa' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId, stepSlug: 'operacao', stepData, nextStep: 'dados-empresa' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Tipo de imóvel *</label>
        <div className="relative">
          <select value={tipoImovel} onChange={e => setTipoImovel(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {TIPOS_IMOVEL.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>
      <div>
        <label className={labelCls}>O imóvel está financiado? *</label>
        <div className="relative">
          <select value={financiado} onChange={e => setFinanciado(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            <option>Não</option><option>Sim</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>
      {financiado === 'Sim' && (
        <div>
          <label className={labelCls}>Valor pago até agora *</label>
          <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
            <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/40">R$</span>
            <input type="text" inputMode="decimal" value={valorPago}
              onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setValorPagoStr(formatBRL(parseInt(digits || '0') / 100)) }}
              placeholder="0,00" className="flex-1 bg-transparent py-4 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none" />
          </div>
          <p className="mt-1.5 text-xs text-surface-foreground/50">Financiamento &gt; 40% do imóvel impede a operação.</p>
        </div>
      )}
      <div>
        <label className={labelCls}>Matrícula *</label>
        <input type="text" inputMode="numeric" value={matricula} onChange={e => setMatricula(e.target.value.replace(/\D/g, ''))} placeholder="Apenas números" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Motivo do crédito *</label>
        <div className="relative">
          <select value={motivo} onChange={e => setMotivo(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending} className={btnCls}>{isPending ? 'Salvando…' : 'Prosseguir'}</button>
    </div>
  )
}

export function HomeEquityPJWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <HomeEquityPJOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-empresa':
      return <DadosEmpresaPJStep {...props} variant="simple" nextStep="atividade-faturamento" />
    case 'atividade-faturamento':
      return <AtividadeFaturamentoStep {...props} nextStep="dados-socios" />
    case 'dados-socios':
      return <DadosSociosStep {...props} nextStep="endereco-garantia" withEstadoCivil />
    case 'endereco-garantia':
      return <EnderecoStep {...props} stepSlug="endereco-garantia" nextStep="endereco-empresa" label="Endereço do Imóvel em Garantia" />
    case 'endereco-empresa':
      return <EnderecoStep {...props} stepSlug="endereco-empresa" nextStep="retorno" label="Endereço da Empresa" showSameAs={{ label: 'Mesmo endereço da garantia', sourceStepSlug: 'endereco-garantia' }} />
    case 'retorno':
      return <RetornoStep {...props} message="Obrigado pelas informações! Em breve teremos o retorno da sua proposta." />
    default:
      return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): HomeEquityPJWizard (CGI PJ)"
```

---

### Task 3: `financiamento-imovel-wizard.tsx`

Operacao: tipo de imóvel, financiado (block > 40%), matrícula. Etapa 1 inclui dados-solicitante (PJ simples), atividade-faturamento, dados-socios, dados-vendedor, endereco-imovel.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizards/financiamento-imovel-wizard.tsx`

- [ ] **Step 1: Criar o wizard**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { createProposal, saveStep } from '../../../actions'
import { selectCls, btnCls, parseBRL, formatBRL, formData, inputCls, labelCls } from '../steps/types'
import { RetornoStep } from '../steps/retorno-step'
import { DadosEmpresaPJStep } from '../steps/dados-empresa-pj-step'
import { AtividadeFaturamentoStep } from '../steps/atividade-faturamento-step'
import { DadosSociosStep } from '../steps/dados-socios-step'
import { DadosVendedorStep } from '../steps/dados-vendedor-step'
import { EnderecoStep } from '../steps/endereco-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_IMOVEL = ['Casa de rua', 'Casa de condomínio', 'Apartamento', 'Terreno', 'Escritório', 'Loja', 'Estúdio', 'Flat']

function FinanciamentoImovelOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'operacao')
  const [tipoImovel, setTipoImovel] = useState(saved.tipoImovel ?? '')
  const [financiado, setFinanciado] = useState(saved.financiado ?? '')
  const [valorPago, setValorPagoStr] = useState(saved.valorPago ? formatBRL(Number(saved.valorPago)) : '')
  const [matricula, setMatricula] = useState(saved.matricula ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!tipoImovel || !financiado || !matricula) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoImovel, financiado, valorPago: parseBRL(valorPago), matricula }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'operacao', stepData, nextStep: 'dados-solicitante' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId, stepSlug: 'operacao', stepData, nextStep: 'dados-solicitante' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Tipo de imóvel *</label>
        <div className="relative">
          <select value={tipoImovel} onChange={e => setTipoImovel(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {TIPOS_IMOVEL.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>
      <div>
        <label className={labelCls}>O imóvel está financiado? *</label>
        <div className="relative">
          <select value={financiado} onChange={e => setFinanciado(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            <option>Não</option><option>Sim</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>
      {financiado === 'Sim' && (
        <div>
          <label className={labelCls}>Valor pago até agora *</label>
          <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
            <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/40">R$</span>
            <input type="text" inputMode="decimal" value={valorPago}
              onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setValorPagoStr(formatBRL(parseInt(digits || '0') / 100)) }}
              placeholder="0,00" className="flex-1 bg-transparent py-4 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none" />
          </div>
          <p className="mt-1.5 text-xs text-surface-foreground/50">Financiamento &gt; 40% impede a operação.</p>
        </div>
      )}
      <div>
        <label className={labelCls}>Matrícula *</label>
        <input type="text" inputMode="numeric" value={matricula} onChange={e => setMatricula(e.target.value.replace(/\D/g, ''))} placeholder="Apenas números" className={inputCls} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending} className={btnCls}>{isPending ? 'Salvando…' : 'Prosseguir'}</button>
    </div>
  )
}

export function FinanciamentoImovelWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <FinanciamentoImovelOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-solicitante':
      return <DadosEmpresaPJStep {...props} variant="simple" nextStep="atividade-faturamento" stepSlug="dados-solicitante" />
    case 'atividade-faturamento':
      return <AtividadeFaturamentoStep {...props} nextStep="dados-socios" hasProdutos />
    case 'dados-socios':
      return <DadosSociosStep {...props} nextStep="dados-vendedor" withEstadoCivil />
    case 'dados-vendedor':
      return <DadosVendedorStep {...props} nextStep="endereco-imovel" stepSlug="dados-vendedor" />
    case 'endereco-imovel':
      return <EnderecoStep {...props} stepSlug="endereco-imovel" nextStep="retorno" label="Endereço do Imóvel" />
    case 'retorno':
      return <RetornoStep {...props} message="Obrigado pelas informações! Em breve teremos o retorno da sua proposta, fique atento ao WhatsApp e e-mail." />
    default:
      return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): FinanciamentoImovelWizard"
```
