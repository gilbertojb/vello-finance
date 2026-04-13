import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Building,
  CreditCard,
  LineChart,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-background/50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Hero Section */}
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-bold tracking-tight">
              Dashboard Geral
            </h1>
            <p className="text-muted-foreground text-lg">
              Monitoramento global do ecossistema e performance de tenants.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 shadow-sm">
              <LineChart className="size-4" />
              Relatório Completo
            </Button>
            <Button className="gap-2 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
              Novo Tenant
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Global Key Metrics - Grid */}
        <div className="mb-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Volume Transacionado
              </CardTitle>
              <div className="rounded-md bg-blue-500/10 p-2 text-blue-500">
                <Wallet className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter">
                R$ 42.5M
              </div>
              <p className="mt-1 flex items-center text-xs text-emerald-500 font-medium">
                <ArrowUpRight className="mr-1 size-3" />
                +14.5% no último mês
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tenants Ativos
              </CardTitle>
              <div className="rounded-md bg-violet-500/10 p-2 text-violet-500">
                <Building className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter">142</div>
              <p className="mt-1 flex items-center text-xs text-emerald-500 font-medium">
                <ArrowUpRight className="mr-1 size-3" />
                +12 novas ativações
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contas Conectadas
              </CardTitle>
              <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-500">
                <Users className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter">18.2K</div>
              <p className="mt-1 flex items-center text-xs text-muted-foreground font-medium">
                <Activity className="mr-1 size-3" />
                Crescimento estável
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Take Rate Médio
              </CardTitle>
              <div className="rounded-md bg-orange-500/10 p-2 text-orange-500">
                <TrendingUp className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter">1.8%</div>
              <p className="mt-1 flex items-center text-xs text-emerald-500 font-medium">
                <ArrowUpRight className="mr-1 size-3" />
                +0.2% margem geral
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Modules */}
        <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-3">
          {/* Main Chart / Analytics Area */}
          <Card className="col-span-full border-border/50 shadow-sm md:col-span-4 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Receita Konsig (Gross)
                  </CardTitle>
                  <CardDescription>
                    Performance de faturamento nos últimos 6 meses
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono">
                  FY-2026
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative h-[300px] w-full rounded-xl border border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center p-6 mt-4">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] rounded-xl mix-blend-overlay"></div>
                <LineChart
                  className="size-10 text-muted-foreground/40 mb-3"
                  strokeWidth={1}
                />
                <p className="text-sm font-medium text-muted-foreground">
                  Área reservada para o Gráfico de Área
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-[250px]">
                  Requer injeção de bibliotecas como Recharts ou Tremor para
                  visualização de dados reais.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="col-span-full border-border/50 shadow-sm md:col-span-3 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl">Atividade Recente</CardTitle>
              <CardDescription>Últimos eventos cross-tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  {
                    title: 'Novo Tenant Ativado',
                    description: 'Acme Corp completou o onboarding.',
                    time: '2h atrás',
                    icon: Building,
                    color: 'text-violet-500',
                    bg: 'bg-violet-500/10',
                  },
                  {
                    title: 'Pico de Transações',
                    description: 'NeoConsig processou R$ 1.2M.',
                    time: '5h atrás',
                    icon: Activity,
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10',
                  },
                  {
                    title: 'Repasse Financeiro',
                    description: 'Liquidação D+1 no parceiro XPTO.',
                    time: '12h atrás',
                    icon: Banknote,
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-500/10',
                  },
                  {
                    title: 'Alerta de Conciliação',
                    description:
                      'Falha reportada na integração Banco do Brasil.',
                    time: '1d atrás',
                    icon: CreditCard,
                    color: 'text-red-500',
                    bg: 'bg-red-500/10',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className={`mt-0.5 rounded-full p-2 ${item.bg}`}>
                      <item.icon className={`size-4 ${item.color}`} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {item.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {item.description}
                      </p>
                      <p className="text-muted-foreground/60 text-[10px] font-mono uppercase tracking-wider">
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full mt-6 text-xs text-muted-foreground hover:text-foreground"
              >
                Ver todos os eventos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Top Tenants Table Preview */}
        <div className="mt-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tenants em Destaque</CardTitle>
                <Button
                  variant="link"
                  className="text-sm text-primary p-0 h-auto"
                >
                  Gerenciar Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    name: 'Grupo Alfa Consig',
                    slug: 'alfa',
                    status: 'Ativo',
                    volume: 'R$ 12.4M',
                    users: 450,
                    avatar: 'A',
                  },
                  {
                    name: 'Credito Já',
                    slug: 'credito-ja',
                    status: 'Ativo',
                    volume: 'R$ 8.1M',
                    users: 312,
                    avatar: 'C',
                  },
                  {
                    name: 'Fintech Sul',
                    slug: 'fin-sul',
                    status: 'Onboarding',
                    volume: '-',
                    users: 5,
                    avatar: 'F',
                  },
                  {
                    name: 'Mega Créditos',
                    slug: 'mega',
                    status: 'Ativo',
                    volume: 'R$ 4.2M',
                    users: 180,
                    avatar: 'M',
                  },
                ].map((tenant) => (
                  <div
                    key={tenant.slug}
                    className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-9 w-9 rounded-md border bg-background">
                        <AvatarFallback className="rounded-md bg-primary/5 text-primary text-xs font-semibold">
                          {tenant.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {tenant.name}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1 font-mono">
                          {tenant.slug}.vellofinance.com.br
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm font-medium">{tenant.volume}</p>
                        <p className="text-muted-foreground text-xs">TPV MTD</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{tenant.users}</p>
                        <p className="text-muted-foreground text-xs">Contas</p>
                      </div>
                      <Badge
                        variant={
                          tenant.status === 'Ativo' ? 'default' : 'secondary'
                        }
                        className={
                          tenant.status === 'Ativo'
                            ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20'
                            : ''
                        }
                      >
                        {tenant.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
