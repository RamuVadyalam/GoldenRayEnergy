-- ════════════════════════════════════════════════════════════════════
-- Migration 004: Deeper Power Bill Analysis columns
-- Adds frequently-queried fields for filtering/aggregation.
-- Richer per-bill detail (scenarios, recommendations, etc.) still lives
-- in the `analysis_json` JSONB column, which requires no migration.
-- Run this ONCE in Supabase → SQL Editor after migration 003.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE power_bill_uploads
  ADD COLUMN IF NOT EXISTS account_number      VARCHAR(60),
  ADD COLUMN IF NOT EXISTS icp_number          VARCHAR(40),
  ADD COLUMN IF NOT EXISTS plan_name           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS user_type           VARCHAR(30),
  ADD COLUMN IF NOT EXISTS peak_rate           NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS off_peak_rate       NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS night_rate          NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS controlled_rate     NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS controlled_kwh      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS gst_amount          NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS prompt_discount     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS solar_export_kwh    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS solar_export_credit NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS prev_period_kwh     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS prev_period_cost    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS due_date            DATE,
  ADD COLUMN IF NOT EXISTS co2_emissions_kg    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS fixed_cost_share    NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS variable_cost_share NUMERIC(5,4);

CREATE INDEX IF NOT EXISTS idx_pbu_plan_name ON power_bill_uploads(plan_name);
CREATE INDEX IF NOT EXISTS idx_pbu_user_type ON power_bill_uploads(user_type);
