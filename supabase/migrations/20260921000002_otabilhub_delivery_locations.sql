-- =====================================================
-- OtabilHub — Delivery Locations Migration
-- =====================================================
-- Adds delivery_locations table for admin-managed delivery configuration
-- and snapshot fields on orders for historical delivery data.

-- =====================================================
-- Delivery Locations Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.delivery_locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  region          TEXT NOT NULL,
  city            TEXT NOT NULL,
  delivery_fee    NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  estimated_delivery TEXT NOT NULL DEFAULT '',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_active ON public.delivery_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_name ON public.delivery_locations(name);

ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active delivery locations"
  ON public.delivery_locations FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admins can view all delivery locations"
  ON public.delivery_locations FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create delivery locations"
  ON public.delivery_locations FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update delivery locations"
  ON public.delivery_locations FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete delivery locations"
  ON public.delivery_locations FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE TRIGGER trg_delivery_locations_updated
  BEFORE UPDATE ON public.delivery_locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT ON public.delivery_locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_locations TO authenticated;

-- =====================================================
-- Orders: Delivery Snapshot Fields
-- =====================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_location_id UUID REFERENCES public.delivery_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_location_name TEXT,
  ADD COLUMN IF NOT EXISTS delivery_region TEXT,
  ADD COLUMN IF NOT EXISTS delivery_city TEXT,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_estimated TEXT DEFAULT '';
