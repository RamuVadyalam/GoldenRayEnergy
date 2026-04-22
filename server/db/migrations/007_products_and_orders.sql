-- ════════════════════════════════════════════════════════════════════
-- Migration 007: Product Catalog + Online Orders
-- ════════════════════════════════════════════════════════════════════

-- ── Product catalog ──
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku             VARCHAR(60) UNIQUE,
  name            VARCHAR(200) NOT NULL,
  brand           VARCHAR(100) NOT NULL,
  category        VARCHAR(40) NOT NULL
    CHECK (category IN ('panel','inverter','battery','ev_charger','mounting','monitoring','accessory')),
  model           VARCHAR(100),
  description     TEXT,

  price           NUMERIC(10,2) NOT NULL,
  compare_price   NUMERIC(10,2),
  price_unit      VARCHAR(20)   DEFAULT 'each',

  image_url       TEXT,
  specs           JSONB         DEFAULT '{}',

  stock_qty       INTEGER       DEFAULT 0,
  in_stock        BOOLEAN       DEFAULT true,
  is_featured     BOOLEAN       DEFAULT false,
  is_active       BOOLEAN       DEFAULT true,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand      ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_active  ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured   ON products(is_featured) WHERE is_featured = true;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated') THEN
    CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END$$;

-- ── Orders ──
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    VARCHAR(20) UNIQUE,
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','paid','packing','shipped','delivered','cancelled','refunded')),

  -- Customer
  first_name      VARCHAR(80),
  last_name       VARCHAR(80),
  email           VARCHAR(255),
  phone           VARCHAR(50),

  -- Shipping
  shipping_address TEXT,
  shipping_city    VARCHAR(100),
  shipping_region  VARCHAR(100),
  shipping_postcode VARCHAR(20),

  -- Billing
  billing_same    BOOLEAN DEFAULT true,
  billing_address TEXT,

  -- Totals
  subtotal        NUMERIC(12,2) NOT NULL,
  shipping_cost   NUMERIC(10,2) DEFAULT 0,
  gst             NUMERIC(10,2) DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL,

  -- Payment
  payment_method  VARCHAR(30) DEFAULT 'bank_transfer'
    CHECK (payment_method IN ('bank_transfer','credit_card','pay_on_pickup','finance','invoice')),
  payment_status  VARCHAR(20) DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','paid','refunded','partial')),

  notes           TEXT,

  -- CRM refs
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  handled_by      UUID REFERENCES users(id)    ON DELETE SET NULL,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email      ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_number     ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_updated') THEN
    CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END$$;

-- ── Order line items ──
CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,

  product_name    VARCHAR(200) NOT NULL,
  product_brand   VARCHAR(100),
  product_sku     VARCHAR(60),
  product_image   TEXT,

  unit_price      NUMERIC(10,2) NOT NULL,
  qty             INTEGER NOT NULL DEFAULT 1,
  subtotal        NUMERIC(12,2) NOT NULL,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
