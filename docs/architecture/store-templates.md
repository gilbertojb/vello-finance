# Sistema de Templates da Store

O aplicativo `store` (Vello Store) possui um sistema de templates dinâmico e extensível projetado para suportar múltiplos *tenants* com aparências e fluxos completamente diferentes (White-label), sem precisar duplicar a aplicação.

O sistema baseia-se em um padrão de **Registry Pattern** aliado a injeção de dependências e customização de variáveis CSS via o layout principal.

## Como Funciona (Visão Geral)

1. **Resolução do Tenant:** Quando uma requisição chega à `store`, o `middleware.ts` identifica o tenant pelo host (subdomínio ou domínio customizado).
2. **Identificação do Template:** Os dados do tenant carregados do Supabase (tabela `tenant_branding`) informam qual `template_id` deve ser utilizado (ex: `default`, `zp`, etc).
3. **Registry:** O sistema consome o `template_id` e busca os arquivos de configuração de cor (`config.ts`) e o componente raiz (`home.tsx`) correspondentes no diretório `apps/store/src/templates/`.
4. **Renderização:** A página `app/(home)/page.tsx` renderiza o componente retornado, repassando propriedades padronizadas (produtos, logo, nome do tenant). O `layout.tsx` injeta as cores (OKLCH) definidas no `config.ts` do template como variáveis CSS.

---

## Estrutura de Pastas e Arquivos

O sistema de templates fica centralizado na pasta `apps/store/src/templates/`:

```
apps/store/src/templates/
├── _types.ts                   ← Tipagens centrais obrigatórias
├── index.ts                    ← Registry de templates (onde todos são registrados)
├── default/                    ← Template 1 (Ex: Default)
│   ├── config.ts               ← Configuração de cores (Oklch) e ID
│   ├── home.tsx                ← Componente raiz da home
│   └── _components/            ← Subcomponentes isolados deste template
└── zp/                         ← Template 2 (Ex: ZP)
    ├── config.ts
    ├── home.tsx
    └── _components/
```

### 1. `_types.ts`
Define os contratos obrigatórios que todo template deve respeitar. 

- `TemplateConfig`: Interface que dita a estrutura de cores do tenant.
- `TemplateHomeProps`: Propriedades injetadas pelo servidor na página principal (nome do display, URL da logo, produtos disponíveis do tenant).
- `TemplateHomeProduct`: Formato padronizado de um produto a ser exibido na vitrine.

### 2. `index.ts` (O Registry)
Este arquivo age como um dicionário. Sempre que um novo template é criado, ele deve ser adicionado explicitamente nos mapas `configRegistry` e `homeRegistry`.

```tsx
import { defaultTemplate } from './default/config'
import { DefaultHome } from './default/home'
import { zpTemplate } from './zp/config'
import { ZpHome } from './zp/home'

const configRegistry: Record<string, TemplateConfig> = {
  default: defaultTemplate,
  zp: zpTemplate,
}

const homeRegistry: Record<string, ComponentType<TemplateHomeProps>> = {
  default: DefaultHome,
  zp: ZpHome,
}
```

A exportação de funções como `getTemplate(id)` e `getHomeComponent(id)` garante que sempre haverá um *fallback* (geralmente caindo para `default`) caso um `template_id` inválido seja solicitado pelo banco.

---

## Anatomia de um Template

Para um novo visual existir, ele precisa de apenas dois arquivos públicos dentro de uma pasta:

### O Arquivo `config.ts`
Define os tokens base da paleta daquele template específico no espaço de cor **OKLCH**, para compatibilidade perfeita com o Tailwind CSS (v4+).

```typescript
// apps/store/src/templates/meu-template/config.ts
import type { TemplateConfig } from '../_types'

export const meuTemplateConfig: TemplateConfig = {
  id: 'meu-template',
  colors: {
    primary:    { l: 0.48, c: 0.25, h: 258 },
    background: { l: 0.98, c: 0.01, h: 200 },
    surface:    { l: 1.00, c: 0.00, h: 0 },
  },
}
```

### O Arquivo `home.tsx`
É o Server Component que dita a estrutura e experiência da página. Ele obrigatoriamente recebe `TemplateHomeProps`. A grande vantagem desta abordagem é que um template pode ser uma simples listagem de cartões, enquanto outro template pode ser uma Landing Page super interativa, complexa e com seções completamente diferentes.

```tsx
// apps/store/src/templates/meu-template/home.tsx
import type { TemplateHomeProps } from '@/templates/_types'
import { StoreHeader } from '@/app/(store)/_components/store-header'
import { MinhaHeroSection } from './_components/hero-section'

export function MeuTemplateHome({
  displayName,
  logoUrl,
  products,
}: TemplateHomeProps) {
  return (
    <div>
      <StoreHeader logoUrl={logoUrl} displayName={displayName} />
      <MinhaHeroSection products={products} />
      {/* Restante da UI exclusiva deste template */}
    </div>
  )
}
```

---

## Criando um Novo Template (Passo a Passo)

1. **Crie o diretório:** `apps/store/src/templates/novo-tema/`.
2. **Crie os subcomponentes:** Adicione componentes específicos na sub-pasta `_components`. É encorajado que cada template tenha seus próprios componentes (Hero, Listagem, CTA) para que a alteração em um template não quebre os outros. O reuso deve se limitar aos componentes primitivos do shadcn (`@/components/ui`).
3. **Crie os arquivos obrigatórios:** Crie o `config.ts` e `home.tsx` dentro da raiz do diretório do novo tema.
4. **Respeite o Contrato:** O `home.tsx` deve exportar um componente padrão React que aceite `TemplateHomeProps`.
5. **Registre o Template:** Edite o arquivo `apps/store/src/templates/index.ts` e importe sua `config` e seu componente `home`. Adicione-os aos objetos `configRegistry` e `homeRegistry` mapeando para um novo ID (ex: `'novo-tema'`).
6. **Teste no Banco:** Atribua o `template_id = 'novo-tema'` ao tenant correspondente no banco de dados para ver a página renderizando a nova estrutura.

## Sobrescrição de Componentes Globais

Por convenção arquitetural, não utilizamos herança de componentes (ou seja, `Template B` importando componentes específicos de `Template A`).
Se a estrutura de um componente for muito parecida:
1. Prefira **duplicar** o componente para a pasta `_components` do seu novo template para manter os templates completamente desacoplados.
2. Elementos que *precisam* ser globalmente consistentes (como `StoreHeader` ou `StoreFooter`) moram em `apps/store/src/app/(store)/_components/`. Estes sim podem ser importados por qualquer template, uma vez que recebem props genéricas como `logoUrl`.

## Injeção de Tema (CSS)

Toda cor referenciada em um template (`bg-primary`, `text-surface`, `bg-background`) usa classes utilitárias do Tailwind.
No Next.js (em `layout.tsx`), as propriedades OKLCH retornadas pelo `config.ts` do template são traduzidas para variáveis CSS inline aplicadas ao elemento HTML, sobrescrevendo assim o tema do projeto em tempo de execução para aquele acesso específico.

```html
<!-- Exemplo de como o CSS é injetado dinamicamente para o template atual -->
<html style="
  --color-primary: oklch(0.48 0.25 258);
  --color-background: oklch(0.98 0.01 200);
">
```
