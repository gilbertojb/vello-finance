-- Migration: adiciona campos pessoais à tabela simulations
-- Todos nullable — sem quebra de retrocompatibilidade

ALTER TABLE simulations
  ADD COLUMN IF NOT EXISTS client_email     TEXT,
  ADD COLUMN IF NOT EXISTS client_cpf       TEXT,
  ADD COLUMN IF NOT EXISTS client_birthdate DATE,
  ADD COLUMN IF NOT EXISTS client_city      TEXT,
  ADD COLUMN IF NOT EXISTS client_income    NUMERIC(12,2);
