-- Migration: add timeout columns to stage_triggers
-- Adiciona timeout_unit e timeout_value caso a tabela tenha sido criada sem eles.

ALTER TABLE stage_triggers
  ADD COLUMN IF NOT EXISTS timeout_unit  VARCHAR(10) CHECK (timeout_unit IN ('minutes', 'hours', 'days')),
  ADD COLUMN IF NOT EXISTS timeout_value INTEGER     CHECK (timeout_value IS NULL OR timeout_value > 0);
