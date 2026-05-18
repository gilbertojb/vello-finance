# Contratação — Wizards: FGTS, Capital de Giro, Antecipação e Consignado

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **Prerequisites:** `contratar-shared-steps.md` e `contratar-etapa2-steps.md` concluídos.

**Goal:** Wizards para `fgts`, `capital_giro`, `antecipacao_recebiveis` e `consignado_privado`.

**Specs:** `docs/features/store/contratar/fgts.md`, `capital-de-giro-pj.md`, `antecipacao-recebiveis-pj.md`, `consignado-clt.md`.

---

### Task 1: `fgts-wizard.tsx`

3 steps únicos: liberacao-saque, liberacao-bancos, verificar-margem. Sem operacao — produto vai direto para o fluxo.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizards/fgts-wizard.tsx`

- [ ] **Step 1: Criar o wizard**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { createProposal, saveStep } from '../../../actions'
import { inputCls, labelCls, btnCls, isValidCPF, calcAge, formData } from '../steps/types'
import { RetornoStep } from '../steps/retorno-step'
import type { ProductWizardProps } from '../steps/types'

function LiberacaoSaqueStep({ proposalId, productId, productTypeSlug, simulationId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'liberacao-saque')
  const [liberou, setLiberou] = useState(saved.liberou ?? '')
  const [jaRealizei, setJaRealizei] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const podeAvancar = liberou === 'Sim' || jaRealizei

  function handleSubmit() {
    if (!podeAvancar) return setError('Complete a etapa antes de continuar.')
    setError('')
    startTransition(async () => {
      const stepData = { liberou: podeAvancar ? 'Sim' : liberou }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'liberacao-saque', stepData, nextStep: 'liberacao-bancos' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId, stepSlug: 'liberacao-saque', stepData, nextStep: 'liberacao-bancos' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-surface-foreground">Saque Aniversário do FGTS</p>
      <p className="text-sm text-surface-foreground/60">Você já liberou o Saque Aniversário no aplicativo do FGTS (Caixa)?</p>
      <div className="flex gap-3">
        {['Sim', 'Não'].map(v => (
          <button key={v} type="button" onClick={() => setLiberou(v)}
            className={`flex-1 rounded-2xl border py-4 text-sm font-semibold transition-colors ${liberou === v ? 'border-primary bg-primary/10 text-primary' : 'border-surface-foreground/15 text-surface-foreground/60'}`}>
            {v}
          </button>
        ))}
      </div>
      {liberou === 'Não' && !jaRealizei && (
        <div className="rounded-2xl border border-surface-foreground/12 bg-surface-foreground/3 p-5 space-y-3">
          <p className="text-sm font-semibold text-surface-foreground">Como liberar o Saque Aniversário:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-surface-foreground/70">
            <li>Acesse o aplicativo <strong>Caixa FGTS</strong></li>
            <li>Vá em <strong>Saque Aniversário</strong></li>
            <li>Selecione <strong>"Optar pelo Saque Aniversário"</strong></li>
            <li>Confirme sua opção</li>
          </ol>
          <button type="button" onClick={() => setJaRealizei(true)}
            className="mt-2 w-full rounded-2xl border border-primary/30 bg-primary/5 py-3 text-sm font-semibold text-primary">
            Já realizei ✓
          </button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending || !podeAvancar} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}

function LiberacaoBancosStep({ proposalId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'liberacao-bancos')
  const [liberou, setLiberou] = useState(saved.liberou ?? '')
  const [jaRealizei, setJaRealizei] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const podeAvancar = liberou === 'Sim' || jaRealizei

  function handleSubmit() {
    if (!podeAvancar) return setError('Complete a etapa antes de continuar.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'liberacao-bancos', stepData: { liberou: 'Sim' }, nextStep: 'verificar-margem' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-surface-foreground">Autorização dos bancos no FGTS</p>
      <p className="text-sm text-surface-foreground/60">Você já autorizou os bancos a acessar seu FGTS para antecipação?</p>
      <div className="flex gap-3">
        {['Sim', 'Não'].map(v => (
          <button key={v} type="button" onClick={() => setLiberou(v)}
            className={`flex-1 rounded-2xl border py-4 text-sm font-semibold transition-colors ${liberou === v ? 'border-primary bg-primary/10 text-primary' : 'border-surface-foreground/15 text-surface-foreground/60'}`}>
            {v}
          </button>
        ))}
      </div>
      {liberou === 'Não' && !jaRealizei && (
        <div className="rounded-2xl border border-surface-foreground/12 bg-surface-foreground/3 p-5 space-y-3">
          <p className="text-sm font-semibold text-surface-foreground">Como autorizar os bancos:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-surface-foreground/70">
            <li>No app Caixa FGTS, acesse <strong>Autorização de bancos</strong></li>
            <li>Selecione os bancos parceiros</li>
            <li>Confirme a autorização</li>
          </ol>
          <button type="button" onClick={() => setJaRealizei(true)}
            className="mt-2 w-full rounded-2xl border border-primary/30 bg-primary/5 py-3 text-sm font-semibold text-primary">
            Já realizei ✓
          </button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending || !podeAvancar} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}

function VerificarMargemStep({ proposalId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'verificar-margem')
  const [nome, setNome] = useState(saved.nome ?? (proposal?.client_name ?? ''))
  const [cpf, setCpf] = useState(saved.cpf ?? '')
  const [rg, setRg] = useState(saved.rg ?? '')
  const [nascimento, setNascimento] = useState(saved.nascimento ?? '')
  const [email, setEmail] = useState(saved.email ?? '')
  const [whatsapp, setWhatsapp] = useState(saved.whatsapp ?? (proposal?.client_phone ?? ''))
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const ageBlock = nascimento && calcAge(nascimento) >= 70

  function handleSubmit() {
    if (!proposalId) return
    if (nome.trim().split(' ').length < 2) return setError('Informe o nome completo.')
    if (!isValidCPF(cpf)) return setError('CPF inválido.')
    if (!rg) return setError('RG obrigatório.')
    if (ageBlock) return setError('Operação indisponível para ≥ 70 anos.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId, stepSlug: 'verificar-margem', stepData: { nome, cpf, rg, nascimento, email, whatsapp }, nextStep: 'dados-bancarios' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-surface-foreground/60">Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente.</p>
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
          <label className={labelCls}>RG *</label>
          <input type="text" value={rg} onChange={e => setRg(e.target.value)} placeholder="Número do RG" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Data de nascimento *</label>
        <input type="date" value={nascimento} onChange={e => setNascimento(e.target.value)} className={inputCls} />
        {ageBlock && <p className="mt-1 text-xs text-destructive">Operação indisponível para ≥ 70 anos.</p>}
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
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending || !!ageBlock} className={btnCls}>{isPending ? 'Salvando…' : 'Prosseguir'}</button>
    </div>
  )
}

// Step dados-bancarios do FGTS usa BankDataForm via saveStep (não finalizeEtapa2)
// Importar DadosBancariosEtapa2Step do etapa2/ mas com nextStep='retorno'
import { DadosBancariosEtapa2Step } from '../etapa2/dados-bancarios-step'

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
      return <RetornoStep {...props} message="Recebemos seus dados e já começamos a análise! Fique de olho no WhatsApp e no e-mail." />
    default:
      return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): FgtsWizard com steps liberacao e verificar-margem"
```

---

### Task 2: `capital-giro-wizard.tsx` + `antecipacao-recebiveis-wizard.tsx`

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizards/capital-giro-wizard.tsx`
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizards/antecipacao-recebiveis-wizard.tsx`

- [ ] **Step 1: Criar `capital-giro-wizard.tsx`**

Operacao: tipo empresa (MEI bloqueado), data de fundação (< 3 anos bloqueia), faturamento 12m (< R$250k bloqueia), motivo. Step `garantia` é específico.

```tsx
'use client'
import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { createProposal, saveStep } from '../../../actions'
import { selectCls, inputCls, labelCls, btnCls, parseBRL, formatBRL, formData } from '../steps/types'
import { BlockMessage } from '../steps/block-message'
import { RetornoStep } from '../steps/retorno-step'
import { DadosEmpresaPJStep } from '../steps/dados-empresa-pj-step'
import { DadosSociosStep } from '../steps/dados-socios-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_EMPRESA = ['LTDA', 'EPP', 'S.A.', 'Outros', 'MEI']
const MOTIVOS = ['Quitar dívidas pessoais', 'Quitar dívidas da empresa', 'Investir em negócio próprio', 'Reforma ou construção', 'Aquisição de outro imóvel', 'Projetos pessoais', 'Outros']
const TIPOS_GARANTIA = ['Duplicatas', 'Cartões de Crédito', 'Aplicações Financeiras', 'Domicílio Simples', 'Imóvel Empresarial', 'Recebíveis']

function CapitalGiroOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'operacao')
  const [tipoEmpresa, setTipoEmpresa] = useState(saved.tipoEmpresa ?? '')
  const [fundacao, setFundacao] = useState(saved.fundacao ?? '')
  const [faturamentoStr, setFaturamentoStr] = useState(saved.faturamento ? formatBRL(Number(saved.faturamento)) : '')
  const [motivo, setMotivo] = useState(saved.motivo ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const blockMei = tipoEmpresa === 'MEI'
  const blockIdade = fundacao ? (new Date().getTime() - new Date(fundacao).getTime()) / (1000 * 60 * 60 * 24 * 365.25) < 3 : false
  const blockFaturamento = parseBRL(faturamentoStr) > 0 && parseBRL(faturamentoStr) < 250000

  function handleSubmit() {
    if (blockMei || blockIdade || blockFaturamento) return
    if (!tipoEmpresa || !fundacao || !faturamentoStr || !motivo) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoEmpresa, fundacao, faturamento: parseBRL(faturamentoStr), motivo }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'operacao', stepData, nextStep: 'dados-empresa' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId, stepSlug: 'operacao', stepData, nextStep: 'dados-empresa' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Tipo de empresa *</label>
        <div className="relative">
          <select value={tipoEmpresa} onChange={e => setTipoEmpresa(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {TIPOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
        {blockMei && <BlockMessage message="Esta linha de crédito não está disponível para MEI." />}
      </div>
      <div>
        <label className={labelCls}>Data de abertura do CNPJ *</label>
        <input type="date" value={fundacao} onChange={e => setFundacao(e.target.value)} className={inputCls} />
        {blockIdade && <BlockMessage message="A empresa precisa ter pelo menos 3 anos de existência para essa linha de crédito." />}
      </div>
      <div>
        <label className={labelCls}>Faturamento dos últimos 12 meses *</label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/40">R$</span>
          <input type="text" inputMode="decimal" value={faturamentoStr}
            onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setFaturamentoStr(formatBRL(parseInt(digits || '0') / 100)) }}
            placeholder="0,00" className="flex-1 bg-transparent py-4 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none" />
        </div>
        {blockFaturamento && <BlockMessage message="O faturamento mínimo exigido para essa linha de crédito é de R$ 250 mil." />}
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
      <button onClick={handleSubmit} disabled={isPending || blockMei || blockIdade || blockFaturamento} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}

function CapitalGiroGarantiaStep({ proposalId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'garantia')
  const [possuiGarantia, setPossuiGarantia] = useState(saved.possuiGarantia ?? '')
  const [tipoGarantia, setTipoGarantia] = useState(saved.tipoGarantia ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!possuiGarantia) return setError('Informe se possui garantia.')
    if (possuiGarantia === 'Sim' && !tipoGarantia) return setError('Selecione o tipo de garantia.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'garantia', stepData: { possuiGarantia, tipoGarantia }, nextStep: 'retorno' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-surface-foreground">Garantia na Operação</p>
      <p className="text-sm text-surface-foreground/60">Sua empresa possui alguma garantia real ou vinculada?</p>
      <div className="flex gap-3">
        {['Sim', 'Não'].map(v => (
          <button key={v} type="button" onClick={() => setPossuiGarantia(v)}
            className={`flex-1 rounded-2xl border py-4 text-sm font-semibold transition-colors ${possuiGarantia === v ? 'border-primary bg-primary/10 text-primary' : 'border-surface-foreground/15 text-surface-foreground/60'}`}>
            {v}
          </button>
        ))}
      </div>
      {possuiGarantia === 'Sim' && (
        <div>
          <label className={labelCls}>Tipo de garantia *</label>
          <div className="relative">
            <select value={tipoGarantia} onChange={e => setTipoGarantia(e.target.value)} className={selectCls}>
              <option value="" disabled>Selecione…</option>
              {TIPOS_GARANTIA.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending} className={btnCls}>{isPending ? 'Salvando…' : 'Prosseguir'}</button>
    </div>
  )
}

export function CapitalGiroWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <CapitalGiroOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-empresa':
      return <DadosEmpresaPJStep {...props} variant="full" nextStep="dados-socios" />
    case 'dados-socios':
      return <DadosSociosStep {...props} nextStep="garantia" withEstadoCivil />
    case 'garantia':
      return <CapitalGiroGarantiaStep {...props} currentStep={currentStep} />
    case 'retorno':
      return <RetornoStep {...props} message="Obrigado pelas informações! Agora é com a gente, sua proposta já está em análise. Fique de olho no WhatsApp e no seu e-mail." />
    default:
      return null
  }
}
```

- [ ] **Step 2: Criar `antecipacao-recebiveis-wizard.tsx`**

Operacao: tipo de recebível, data de fundação (< 3 anos bloqueia), faturamento 12m (< R$120k bloqueia), motivo. Sócios pedem RG.

```tsx
'use client'
import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { createProposal, saveStep } from '../../../actions'
import { selectCls, inputCls, labelCls, btnCls, parseBRL, formatBRL, formData } from '../steps/types'
import { BlockMessage } from '../steps/block-message'
import { RetornoStep } from '../steps/retorno-step'
import { DadosEmpresaPJStep } from '../steps/dados-empresa-pj-step'
import { DadosSociosStep } from '../steps/dados-socios-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_RECEBIVEL = ['Maquininha (Cartão de Crédito)', 'Duplicata', 'Nota Fiscal Eletrônica (NF-e)', 'Contrato a Receber']
const MOTIVOS = ['Quitar dívidas pessoais', 'Quitar dívidas da empresa', 'Investir em negócio próprio', 'Reforma ou construção', 'Aquisição de outro imóvel', 'Projetos pessoais', 'Outros']

function AntecipacaoOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'operacao')
  const [tipoRecebivel, setTipoRecebivel] = useState(saved.tipoRecebivel ?? '')
  const [fundacao, setFundacao] = useState(saved.fundacao ?? '')
  const [faturamentoStr, setFaturamentoStr] = useState(saved.faturamento ? formatBRL(Number(saved.faturamento)) : '')
  const [motivo, setMotivo] = useState(saved.motivo ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const blockIdade = fundacao ? (new Date().getTime() - new Date(fundacao).getTime()) / (1000 * 60 * 60 * 24 * 365.25) < 3 : false
  const blockFaturamento = parseBRL(faturamentoStr) > 0 && parseBRL(faturamentoStr) < 120000

  function handleSubmit() {
    if (blockIdade || blockFaturamento) return
    if (!tipoRecebivel || !fundacao || !faturamentoStr || !motivo) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoRecebivel, fundacao, faturamento: parseBRL(faturamentoStr), motivo }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'operacao', stepData, nextStep: 'dados-empresa' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId, stepSlug: 'operacao', stepData, nextStep: 'dados-empresa' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Tipo de recebível *</label>
        <div className="relative">
          <select value={tipoRecebivel} onChange={e => setTipoRecebivel(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {TIPOS_RECEBIVEL.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Data de abertura do CNPJ *</label>
        <input type="date" value={fundacao} onChange={e => setFundacao(e.target.value)} className={inputCls} />
        {blockIdade && <BlockMessage message="A empresa precisa ter pelo menos 3 anos de existência para essa linha de crédito." />}
      </div>
      <div>
        <label className={labelCls}>Faturamento dos últimos 12 meses *</label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/40">R$</span>
          <input type="text" inputMode="decimal" value={faturamentoStr}
            onChange={e => { const digits = e.target.value.replace(/\D/g, ''); setFaturamentoStr(formatBRL(parseInt(digits || '0') / 100)) }}
            placeholder="0,00" className="flex-1 bg-transparent py-4 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none" />
        </div>
        {blockFaturamento && <BlockMessage message="O faturamento mínimo exigido para essa linha de crédito é de R$ 120 mil." />}
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
      <button onClick={handleSubmit} disabled={isPending || blockIdade || blockFaturamento} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}

export function AntecipacaoRecebiveisWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <AntecipacaoOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-empresa':
      return <DadosEmpresaPJStep {...props} variant="full" nextStep="dados-socios" />
    case 'dados-socios':
      return <DadosSociosStep {...props} nextStep="retorno" withRg withEstadoCivil={false} />
    case 'retorno':
      return <RetornoStep {...props} message="Obrigado pelas informações! Agora é com a gente, sua proposta já está em análise. Fique de olho no WhatsApp e no seu e-mail." />
    default:
      return null
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): CapitalGiroWizard e AntecipacaoRecebiveisWizard"
```

---

### Task 3: `consignado-privado-wizard.tsx`

Steps únicos: pre-filtro (4 perguntas qualificatórias), autorizacao-dataprev (checkbox), dados-profissionais. Usa DadosPessoaisPFStep, DadosBancariosEtapa2Step e RetornoStep compartilhados.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizards/consignado-privado-wizard.tsx`

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
import { DadosBancariosEtapa2Step } from '../etapa2/dados-bancarios-step'
import type { ProductWizardProps } from '../steps/types'

const TEMPOS_EMPRESA_CLT = ['Menos de 6 meses', '6 meses a 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos']

function PreFiltroStep({ proposalId, productId, productTypeSlug, simulationId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'pre-filtro')
  const [clt, setClt] = useState(saved.clt ?? '')
  const [vinculo, setVinculo] = useState(saved.vinculo ?? '')
  const [tempo, setTempo] = useState(saved.tempo ?? '')
  const [idade, setIdade] = useState(saved.idade ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const blocked = clt === 'Não' || vinculo === 'Não' || tempo === 'Não' || idade === 'Não'
  const allSim = clt === 'Sim' && vinculo === 'Sim' && tempo === 'Sim' && idade === 'Sim'

  function handleSubmit() {
    if (blocked || !allSim) return
    startTransition(async () => {
      const stepData = { clt, vinculo, tempo, idade }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'pre-filtro', stepData, nextStep: 'autorizacao-dataprev' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId, stepSlug: 'pre-filtro', stepData, nextStep: 'autorizacao-dataprev' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  const pergunta = (label: string, val: string, set: (v: string) => void) => (
    <div>
      <p className="mb-2 text-sm font-medium text-surface-foreground">{label}</p>
      <div className="flex gap-3">
        {['Sim', 'Não'].map(v => (
          <button key={v} type="button" onClick={() => set(v)}
            className={`flex-1 rounded-2xl border py-3 text-sm font-semibold transition-colors ${val === v ? 'border-primary bg-primary/10 text-primary' : 'border-surface-foreground/15 text-surface-foreground/60'}`}>
            {v}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-surface-foreground">Verificação de elegibilidade</p>
      {pergunta('Você trabalha com carteira assinada (CLT)?', clt, setClt)}
      {pergunta('Seu vínculo está ativo (sem aviso prévio)?', vinculo, setVinculo)}
      {pergunta('Tempo de empresa igual ou superior a 6 meses?', tempo, setTempo)}
      {pergunta('Sua idade está entre 21 e 65 anos?', idade, setIdade)}
      {blocked && <BlockMessage message="Infelizmente, não atende aos requisitos mínimos para esta modalidade de crédito no momento. Mas existem outras opções disponíveis para você!" />}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending || !allSim} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}

function AutorizacaoDataprevStep({ proposalId, proposal }: ProductWizardProps) {
  const [autorizado, setAutorizado] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!autorizado) return setError('Autorização obrigatória para prosseguir.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'autorizacao-dataprev', stepData: { autorizado: true }, nextStep: 'dados-pessoais' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-surface-foreground">Autorização Dataprev</p>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-surface-foreground/12 bg-surface-foreground/3 p-4">
        <input type="checkbox" className="mt-0.5 h-4 w-4 flex-shrink-0 rounded accent-primary" checked={autorizado} onChange={e => setAutorizado(e.target.checked)} />
        <span className="text-sm text-surface-foreground/80">
          Autorizo a consulta dos meus dados via Dataprev para análise de crédito consignado.
        </span>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending || !autorizado} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}

function DadosProfissionaisStep({ proposalId, proposal }: ProductWizardProps) {
  const saved = formData<Record<string, string>>(proposal, 'dados-profissionais')
  const [empresa, setEmpresa] = useState(saved.empresa ?? '')
  const [tempoEmpresa, setTempoEmpresa] = useState(saved.tempoEmpresa ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const blockTempo = tempoEmpresa === 'Menos de 6 meses'

  function handleSubmit() {
    if (blockTempo || !empresa || !tempoEmpresa) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'dados-profissionais', stepData: { empresa, tempoEmpresa, tipoContrato: 'CLT (Carteira Assinada)' }, nextStep: 'dados-bancarios' })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Empresa atual *</label>
        <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Nome da empresa" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Tempo de empresa *</label>
        <div className="relative">
          <select value={tempoEmpresa} onChange={e => setTempoEmpresa(e.target.value)} className={selectCls}>
            <option value="" disabled>Selecione…</option>
            {TEMPOS_EMPRESA_CLT.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
        {blockTempo && <BlockMessage message="É necessário ter pelo menos 6 meses de empresa para esta linha de crédito." />}
      </div>
      <div>
        <label className={labelCls}>Tipo de contrato</label>
        <input type="text" value="CLT (Carteira Assinada)" readOnly className={`${inputCls} opacity-60`} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={handleSubmit} disabled={isPending || blockTempo} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}

export function ConsignadoPrivadoWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'pre-filtro':
      return <PreFiltroStep {...props} currentStep={currentStep} />
    case 'autorizacao-dataprev':
      return <AutorizacaoDataprevStep {...props} currentStep={currentStep} />
    case 'dados-pessoais':
      return <DadosPessoaisPFStep {...props} nextStep="dados-profissionais" />
    case 'dados-profissionais':
      return <DadosProfissionaisStep {...props} currentStep={currentStep} />
    case 'dados-bancarios':
      return <DadosBancariosEtapa2Step {...props} nextStep="retorno" />
    case 'retorno':
      return <RetornoStep {...props} message="Muito obrigado! Recebemos os seus dados e vamos iniciar a análise. Fique atento ao WhatsApp e e-mail, em breve você recebe um retorno." />
    default:
      return null
  }
}
```

- [ ] **Step 2: Verificar compilação**

```bash
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | grep "_components/wizards"
```

Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): ConsignadoPrivadoWizard com pre-filtro e autorizacao Dataprev"
```
