-- ════════════════════════════════════════════════════════════════════
-- Migration 005: Add night_kwh + controlled_kwh band columns
-- These were added to the bill extractor for Genesis-style tariffs
-- (ripple-controlled hot water, night rate) but the original migration
-- only included peak + off-peak. Run after 004.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE power_bill_uploads
  ADD COLUMN IF NOT EXISTS night_kwh      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS controlled_kwh NUMERIC(10,2);
