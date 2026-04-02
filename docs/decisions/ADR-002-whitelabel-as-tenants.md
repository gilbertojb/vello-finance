# ADR-002: White-Labels como Instâncias, não Repositórios

**Data:** Abril 2026 · **Status:** Aceito

## Contexto

A plataforma oferece white-label onde cada cliente tem domínio e identidade visual próprios.
A abordagem inicial considerada era criar um repositório ou branch por cliente.

## Decisão

White-labels são **dados no banco**, não código separado. Cada white-label é um tenant
com `custom_domain` preenchido. O roteamento é feito pelo middleware do Next.js que lê
o hostname e resolve o tenant_id correspondente. A Vercel gerencia os domínios customizados
via API programática.

```
Novo white-label contratado
  → INSERT em tenants (custom_domain preenchido)
  → Cliente aponta CNAME no DNS
  → Vercel API registra o domínio + SSL automático
  → Store e Console respondem no novo domínio com identidade do tenant
```

Zero código novo. Zero deploy. Zero repositório novo.

## Consequências

**Positivas:** onboarding de white-label operacional sem envolvimento do time de engenharia ·
manutenção centralizada (bug fix em um lugar corrige todos os white-labels) ·
escala linear sem complexidade operacional crescente.

**Negativas:** customizações muito específicas de um white-label não podem ser feitas
sem afetar todos (mitigado pelo sistema de configuração via banco: cores, logo, produtos, textos).

## Alternativas Descartadas

**Repositório por cliente:** inviável — cada novo contrato exige trabalho de engenharia,
migrations duplicadas e impossibilidade de atualizar todos os clientes simultaneamente.

**Branch por cliente:** mesmo problema, com conflitos de merge adicionais.
