# Design — Edição de Produtos de Crédito

**Data:** 2026-04-04
**App:** `apps/admin`
**Feature:** F3 — Editar Produto (`/products/[id]/edit`)
**Baseado em:** `docs/features/admin/products/SPEC.md`

---

## Escopo

Implementar a página de edição de produtos (`/products/[id]/edit`), adaptando o formulário existente para modo edição e adicionando a action `updateProduct`. A tabela de listagem terá o botão "Exibir" substituído por um ícone de lápis (padrão de `financial-partners`).

Fora do escopo: página de detalhes (`/products/[id]`), modal de desativação (F4), filtros na listagem (F1).

---

## Arquivos Afetados

| Arquivo | Mudança |
|---|---|
| `products/[id]/edit/page.tsx` | Novo — Server Component |
| `products/_components/product-form.tsx` | Adaptar — aceitar prop `product?` |
| `products/actions.ts` | Adicionar — `updateProduct` |
| `products/_components/product-table.tsx` | Adaptar — trocar botão por ícone Pencil |

---

## Arquitetura

### `products/[id]/edit/page.tsx` (novo)

Server Component que:
- Recebe `params: Promise<{ id: string }>`
- Chama `getProduct(id)` e `listFinancialPartners()` em paralelo (já existem em `queries.ts`)
- Se produto não encontrado → `notFound()`
- Renderiza layout igual ao `new/page.tsx` com título "Editar Produto" e subtítulo `{product.name}`
- Passa `product` e `partners` para `<ProductForm />`

### `ProductForm` — Modo Edição

Prop `product?` opcional (tipo derivado do retorno de `getProduct`). `isEdit = !!product`.

**Quando `isEdit = true`:**
- `<input type="hidden" name="id" value={product.id} />` no início do form
- Banner de aviso no topo do formulário: *"Alterações nos percentuais não afetam propostas já criadas (snapshots imutáveis)"*
- Campo **Tipo**: `disabled` com `defaultValue={product.type}` — read-only conforme spec
- Todos os campos de texto/número: `defaultValue={product.campo ?? ''}`
- Switch `is_active`: `defaultChecked={product.is_active}`
- Rich text editors: inicializados com `product.description` e `product.internal_description`
- `PartnerItem`: marcado como `defaultChecked` se o parceiro já está em `product.product_financial_partners`, com comissões pré-preenchidas
- Action usada: `updateProduct`
- Toast: `"Produto atualizado com sucesso!"` → `router.push('/products')`

### `updateProduct` (nova action em `actions.ts`)

```
1. Extrair id do FormData
2. Validar campos do produto com o mesmo productSchema (sem type)
3. Validar comissões com partnerCommissionSchema
4. UPDATE products SET ... WHERE id = id
5. Calcular diff de IFs:
   - submitted_ids = partner_ids submetidos
   - DELETE FROM product_financial_partners
     WHERE product_id = id AND financial_partner_id NOT IN (submitted_ids)
   - UPSERT product_financial_partners
     onConflict: 'product_id,financial_partner_id'
6. revalidatePath('/products')
7. Retornar { success: true }
```

Validação: campo `type` não é incluído no schema de update (é read-only no form).

### `product-table.tsx` — Ação atualizada

Substituir:
```tsx
// antes
<Button variant="ghost" size="sm" asChild>
  <Link href={`/products/${product.id}`}>Exibir</Link>
</Button>

// depois
<Button variant="ghost" size="sm" asChild>
  <Link href={`/products/${product.id}/edit`}>
    <Pencil className="size-4" />
  </Link>
</Button>
```

---

## Tratamento de Edge Cases

- Produto não encontrado → `notFound()` (404)
- IF removida de um produto que já tinha propostas → sem problema (snapshots já foram tirados no momento da proposta)
- Submit sem nenhuma IF → DELETE all `product_financial_partners` para o produto, sem INSERT
- Tipo não submetido pelo form (disabled) → action não valida nem atualiza o campo `type`

---

## Restrições

- `page.tsx` é Server Component — busca dados no Supabase server client
- `product-form.tsx` é Client Component — recebe dados via props, sem acesso ao banco
- `updateProduct` usa `'use server'` — único ponto de mutação
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no cliente
