-- Migration: create_stage_triggers
-- Triggers de webhook disparados em eventos de etapas de pipeline.
-- RLS: backoffice apenas — triggers são automações internas.

CREATE TABLE stage_triggers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id         UUID NOT NULL REFERENCES proposal_stages(id) ON DELETE CASCADE,
  event_type       VARCHAR(20) NOT NULL CHECK (event_type IN ('on_enter', 'on_exit', 'on_timeout')),
  webhook_url      TEXT NOT NULL,
  payload_template JSONB,
  timeout_unit     VARCHAR(10) CHECK (timeout_unit IN ('minutes', 'hours', 'days')),
  timeout_value    INTEGER CHECK (timeout_value IS NULL OR timeout_value > 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stage_triggers_stage_event
  ON stage_triggers(stage_id, event_type);

-- RLS
ALTER TABLE stage_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON stage_triggers
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );
