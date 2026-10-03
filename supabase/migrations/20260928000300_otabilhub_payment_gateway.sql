-- =====================================================
-- OtabilHub — Payment Gateway Support
-- =====================================================
-- Adds payment columns to orders table for payment provider integration.
-- Supports Flutterwave (default) with extensible design for other providers.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_provider TEXT CHECK (payment_provider IN ('flutterwave', 'stripe', 'manual')) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS payment_tx_ref TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_tx_ref ON public.orders(payment_tx_ref);
CREATE INDEX IF NOT EXISTS idx_orders_payment_state ON public.orders(payment_state);
