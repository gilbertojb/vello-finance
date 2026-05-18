# Contratação — Wizards de Veículo e Financiamento

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **Prerequisites:** `contratar-shared-steps.md` e `contratar-etapa2-steps.md` concluídos.

**Goal:** Wizards completos para `auto_equity` (PF), `auto_equity_pj` e `financiamento_veiculo`.

**Specs:** `docs/features/store/contratar/auto-equity-pf.md`, `auto-equity-pj.md`, `financiamento-veiculo.md`.

---

### Task 1: `auto-equity-wizard.tsx`

Operacao: tipo de veículo, veículo financiado (block se Sim), placa, ano de fabricação (block > 15 anos), motivo.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizards/auto-equity-wizard.tsx`

- [ ] **Step 1: Criar o wizard**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { createProposal, saveStep } from '../../../actions'
import { selectCls, inputCls, labelCls, btnCls, formData } from '../steps/types'
import { BlockMessage } from '../steps/block-message'
import { RetornoStep } from '../steps/retorno-step'
import { DadosPessoaisPFStep } from '../steps/dados-pessoais-pf-step'
import { RendaOcupacaoStep } from '../steps/renda-ocupacao-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_VEICULO = ['Carro', 'Caminhão', 'Moto']
const MOTIVOS = ['Quitar dívidas pessoais', 'Quitar dívidas da empresa', 'Investir em negócio próprio', 'Reforma ou construção', 'Aquisição de outro imóvel', 'Projetos pessoais', 'Outros']
const currentYear = new Date().getFullYear()
const ANOS = Array.from({ length: currentYear - 1959 }, (_, i) => String(currentYear - i))

function AutoEquityOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'operacao')
  const [tipoVeiculo, setTipoVeiculo] = useState(saved.tipoVeiculo ?? '')
  const [financiado, setFinanciado] = useState(saved.financiado ?? '')
  const [placa, setPlaca] = useState(saved.placa ?? '')
  const [ano, setAno] = useState(saved.ano ?? '')
  const [motivo, setMotivo] = useState(saved.motivo ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const blockFinanciado = financiado === 'Sim'
  const blockAno = ano && currentYear - Number(ano) > 15

  function handleSubmit() {
    if (blockFinanciado || blockAno) return
    if (!tipoVeiculo || !financiado || !placa || !ano || !motivo) return setError('Preencha todos os campos.')
    if (!/^[A-Z]{3}[\d]{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/i.test(placa.replace('-', ''))) return setError('Formato de placa inválido.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoVeiculo, financiado, placa: placa.toUpperCase(), ano, motivo }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'operacao', stepData, nextStep: 'dados-pessoais' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId, stepSlug: 'operacao', stepData, nextStep: 'dados-pessoais' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Tipo de veículo *</label>
        <div className="relative">
          <select value={tipoVeiculo} onChange={e => setTipoVeiculo(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {TIPOS_VEICULO.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>
      <div>
        <label className={labelCls}>O veículo está financiado? *</label>
        <div className="relative">
          <select value={financiado} onChange={e => setFinanciado(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            <option>Não</option><option>Sim</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
        {blockFinanciado && <BlockMessage message="No momento, não conseguimos seguir pois o veículo ainda possui um financiamento ativo. Para avançarmos, ele precisa estar totalmente quitado." />}
      </div>
      <div>
        <label className={labelCls}>Placa do veículo *</label>
        <input type="text" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="ABC-1234 ou ABC1D23" className={inputCls} maxLength={8} />
      </div>
      <div>
        <label className={labelCls}>Ano de fabricação *</label>
        <div className="relative">
          <select value={ano} onChange={e => setAno(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
        {blockAno && <BlockMessage message="Este veículo não atende aos requisitos mínimos de ano de fabricação." />}
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
      <button onClick={handleSubmit} disabled={isPending || blockFinanciado || !!blockAno} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}

export function AutoEquityWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <AutoEquityOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-pessoais':
      return <DadosPessoaisPFStep {...props} nextStep="renda-ocupacao" withNomeMae />
    case 'renda-ocupacao':
      return <RendaOcupacaoStep {...props} nextStep="retorno" />
    case 'retorno':
      return <RetornoStep {...props} message="Tudo certo por aqui! Recebemos suas informações e já iniciamos a análise. Em breve você vai receber um retorno no WhatsApp e no e-mail." />
    default:
      return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): AutoEquityWizard (PF)"
```

---

### Task 2: `auto-equity-pj-wizard.tsx`

Mesma operacao de veículo do Auto Equity PF. Etapa 1 PJ: dados-empresa, atividade-faturamento, dados-socios.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizards/auto-equity-pj-wizard.tsx`

- [ ] **Step 1: Criar o wizard**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { createProposal, saveStep } from '../../../actions'
import { selectCls, btnCls, formData, labelCls, inputCls } from '../steps/types'
import { BlockMessage } from '../steps/block-message'
import { RetornoStep } from '../steps/retorno-step'
import { DadosEmpresaPJStep } from '../steps/dados-empresa-pj-step'
import { AtividadeFaturamentoStep } from '../steps/atividade-faturamento-step'
import { DadosSociosStep } from '../steps/dados-socios-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_VEICULO = ['Carro', 'Caminhão', 'Moto']
const MOTIVOS = ['Quitar dívidas pessoais', 'Quitar dívidas da empresa', 'Investir em negócio próprio', 'Reforma ou construção', 'Aquisição de outro imóvel', 'Projetos pessoais', 'Outros']
const currentYear = new Date().getFullYear()
const ANOS = Array.from({ length: currentYear - 1959 }, (_, i) => String(currentYear - i))

function AutoEquityPJOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'operacao')
  const [tipoVeiculo, setTipoVeiculo] = useState(saved.tipoVeiculo ?? '')
  const [financiado, setFinanciado] = useState(saved.financiado ?? '')
  const [placa, setPlaca] = useState(saved.placa ?? '')
  const [ano, setAno] = useState(saved.ano ?? '')
  const [motivo, setMotivo] = useState(saved.motivo ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const blockFinanciado = financiado === 'Sim'
  const blockAno = ano && currentYear - Number(ano) > 15

  function handleSubmit() {
    if (blockFinanciado || blockAno) return
    if (!tipoVeiculo || !financiado || !placa || !ano || !motivo) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoVeiculo, financiado, placa: placa.toUpperCase(), ano, motivo }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'operacao', stepData, nextStep: 'dados-empresa' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId, stepSlug: 'operacao', stepData, nextStep: 'dados-empresa' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Tipo de veículo *</label>
        <div className="relative">
          <select value={tipoVeiculo} onChange={e => setTipoVeiculo(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {TIPOS_VEICULO.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Veículo financiado? *</label>
        <div className="relative">
          <select value={financiado} onChange={e => setFinanciado(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            <option>Não</option><option>Sim</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
        {blockFinanciado && <BlockMessage message="Não conseguimos prosseguir pois o veículo ainda possui financiamento ativo." />}
      </div>
      <div>
        <label className={labelCls}>Placa *</label>
        <input type="text" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="ABC-1234" className={inputCls} maxLength={8} />
      </div>
      <div>
        <label className={labelCls}>Ano de fabricação *</label>
        <div className="relative">
          <select value={ano} onChange={e => setAno(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
        {blockAno && <BlockMessage message="Este veículo não atende aos requisitos mínimos de ano de fabricação." />}
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
      <button onClick={handleSubmit} disabled={isPending || blockFinanciado || !!blockAno} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}

export function AutoEquityPJWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <AutoEquityPJOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-empresa':
      return <DadosEmpresaPJStep {...props} variant="simple" nextStep="atividade-faturamento" />
    case 'atividade-faturamento':
      return <AtividadeFaturamentoStep {...props} nextStep="dados-socios" faturamentoLabel="Faturamento mensal" />
    case 'dados-socios':
      return <DadosSociosStep {...props} nextStep="retorno" withEstadoCivil />
    case 'retorno':
      return <RetornoStep {...props} message="Tudo certo! Recebemos suas informações e já iniciamos a análise da proposta." />
    default:
      return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): AutoEquityPJWizard"
```

---

### Task 3: `financiamento-veiculo-wizard.tsx`

Operacao: tipo de veículo, veículo financiado (block > 80% pago), placa. Sem bloco por ano. Etapa 1 PF: dados-pessoais (com nome da mãe), renda-ocupacao, dados-vendedor.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizards/financiamento-veiculo-wizard.tsx`

- [ ] **Step 1: Criar o wizard**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { createProposal, saveStep } from '../../../actions'
import { selectCls, inputCls, labelCls, btnCls, formData } from '../steps/types'
import { RetornoStep } from '../steps/retorno-step'
import { DadosPessoaisPFStep } from '../steps/dados-pessoais-pf-step'
import { RendaOcupacaoStep } from '../steps/renda-ocupacao-step'
import { DadosVendedorStep } from '../steps/dados-vendedor-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_VEICULO = ['Carro', 'Moto', 'Caminhão', 'Van']

function FinanciamentoVeiculoOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'operacao')
  const [tipoVeiculo, setTipoVeiculo] = useState(saved.tipoVeiculo ?? '')
  const [financiado, setFinanciado] = useState(saved.financiado ?? '')
  const [placa, setPlaca] = useState(saved.placa ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!tipoVeiculo || !financiado || !placa) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoVeiculo, financiado, placa: placa.toUpperCase() }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'operacao', stepData, nextStep: 'dados-pessoais' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId, stepSlug: 'operacao', stepData, nextStep: 'dados-pessoais' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Tipo de veículo *</label>
        <div className="relative">
          <select value={tipoVeiculo} onChange={e => setTipoVeiculo(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {TIPOS_VEICULO.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>
      <div>
        <label className={labelCls}>O veículo já está financiado? *</label>
        <div className="relative">
          <select value={financiado} onChange={e => setFinanciado(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            <option>Não</option><option>Sim</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
        {financiado === 'Sim' && (
          <p className="mt-1.5 text-xs text-surface-foreground/50">Atenção: se o valor pago já superar 80% do veículo, a operação não poderá prosseguir.</p>
        )}
      </div>
      <div>
        <label className={labelCls}>Placa do veículo *</label>
        <input type="text" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="ABC-1234" className={inputCls} maxLength={8} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending} className={btnCls}>{isPending ? 'Salvando…' : 'Prosseguir'}</button>
    </div>
  )
}

export function FinanciamentoVeiculoWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <FinanciamentoVeiculoOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-pessoais':
      return <DadosPessoaisPFStep {...props} nextStep="renda-ocupacao" withNomeMae />
    case 'renda-ocupacao':
      return <RendaOcupacaoStep {...props} nextStep="dados-vendedor" />
    case 'dados-vendedor':
      return <DadosVendedorStep {...props} nextStep="retorno" />
    case 'retorno':
      return <RetornoStep {...props} message="Obrigado pelas informações! Em breve teremos o retorno da sua proposta, fique atento ao WhatsApp e e-mail." />
    default:
      return null
  }
}
```

- [ ] **Step 2: Verificar compilação dos 3 wizards**

```bash
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | grep "wizards/auto\|wizards/financiamento-veiculo"
```

Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): FinanciamentoVeiculoWizard"
```
