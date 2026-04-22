-- ════════════════════════════════════════════════════════════════════
-- Migration 003: Power Bill Uploads & Analysis
-- Run this ONCE in Supabase → SQL Editor
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS power_bill_uploads (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Applicant (optional link to contacts table)
  contact_id            UUID REFERENCES contacts(id) ON DELETE SET NULL,
  uploader_name         VARCHAR(120),
  uploader_email        VARCHAR(255),
  uploader_phone        VARCHAR(50),
  uploader_address      TEXT,
  region                VARCHAR(100),

  -- File metadata
  file_name             VARCHAR(255),
  file_size             INTEGER,
  mime_type             VARCHAR(100),

  -- Raw extracted text (full OCR / PDF text)
  raw_text              TEXT,

  -- Parsed fields from the bill
  retailer              VARCHAR(100),
  billing_period_start  DATE,
  billing_period_end    DATE,
  billing_days          INTEGER,

  total_kwh             NUMERIC(10,2),
  peak_kwh              NUMERIC(10,2),
  off_peak_kwh          NUMERIC(10,2),
  avg_daily_kwh         NUMERIC(8,2),

  total_cost            NUMERIC(10,2),
  daily_fixed_charge    NUMERIC(10,2),
  avg_cost_per_kwh      NUMERIC(6,4),

  -- Status + analysis
  status                VARCHAR(20) DEFAULT 'processed'
    CHECK (status IN ('processed','partial','failed','pending')),
  analysis_json         JSONB,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pbu_created_at ON power_bill_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pbu_retailer   ON power_bill_uploads(retailer);
CREATE INDEX IF NOT EXISTS idx_pbu_contact    ON power_bill_uploads(contact_id);
CREATE INDEX IF NOT EXISTS idx_pbu_region     ON power_bill_uploads(region);
CREATE INDEX IF NOT EXISTS idx_pbu_status     ON power_bill_uploads(status);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pbu_updated') THEN
    CREATE TRIGGER trg_pbu_updated BEFORE UPDATE ON power_bill_uploads
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END$$;
