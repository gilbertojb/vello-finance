# ADR-001: Snapshots Imutáveis de Comissão

**Data:** Abril 2026 · **Status:** Aceito

## Contexto

Percentuais de comissão mudam ao longo do tempo. O sistema precisa calcular e auditar
com precisão o que cada parte recebeu em cada proposta, mesmo que as regras vigentes
tenham mudado desde então.

## Decisão

Tabela `commission_snapshots` **append-only** (sem UPDATE, sem DELETE), populada
automaticamente via trigger PostgreSQL no INSERT de cada proposta.

Imutabilidade reforçada em dois níveis:
1. Políticas RLS bloqueiam UPDATE e DELETE
2. Trigger usa SECURITY DEFINER — sem exposição ao cliente

## Consequências

**Positivas:** auditoria perfeita · alterações futuras não afetam propostas antigas ·
CNAB sempre usa dados históricos corretos · conformidade com auditorias do mercado financeiro.

**Negativas:** join necessário para consultas · correção de snapshot errado requer processo
formal de estorno (não é possível editar diretamente).

## Alternativas Descartadas

**Salvar percentuais direto na proposta:** não captura todos os níveis da cascata.
**Versionamento de tabelas:** mais complexo de consultar. Snapshot é suficiente para o caso.
