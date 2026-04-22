-- ════════════════════════════════════════════════════════════════════
-- Migration 006: Product Enquiries
-- Captures purchase-intent leads from the per-market product pages
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS product_enquiries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Applicant
  first_name      VARCHAR(80),
  last_name       VARCHAR(80),
  email           VARCHAR(255),
  phone           VARCHAR(50),
  address         TEXT,

  -- What they want
  market          VARCHAR(30) NOT NULL CHECK (market IN ('residential','commercial','offgrid')),
  bundle_id       VARCHAR(60),
  bundle_name     VARCHAR(150),
  product_brands  TEXT[],
  budget_band     VARCHAR(50),
  intent          VARCHAR(30) CHECK (intent IN ('quote','purchase','consultation','info')),
  timeframe       VARCHAR(40),

  -- Purchase flow
  qty             INTEGER DEFAULT 1,
  approx_value    NUMERIC(12,2),
  notes           TEXT,

  -- CRM links
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_to    UUID REFERENCES users(id)     ON DELETE SET NULL,

  status          VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','contacted','quoted','won','lost')),

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_enq_status     ON product_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_prod_enq_market     ON product_enquiries(market);
CREATE INDEX IF NOT EXISTS idx_prod_enq_email      ON product_enquiries(email);
CREATE INDEX IF NOT EXISTS idx_prod_enq_created_at ON product_enquiries(created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prod_enq_updated') THEN
    CREATE TRIGGER trg_prod_enq_updated BEFORE UPDATE ON product_enquiries
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END$$;
