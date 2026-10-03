-- =====================================================
-- OtabilHub — Phase 9 Migration: Payment + Delivery Foundation
-- =====================================================
-- Adds a payment_state column to the orders table, separate from
-- the existing fulfillment status column. This decouples payment
-- lifecycle from order fulfillment lifecycle.
--
-- PAYMENT STATES:
--   pending   — Order created, payment not yet processed/authorized
--   paid      — Payment successfully captured
--   failed    — Payment attempt failed
--   refunded  — Payment was refunded
--
-- ORDER STATUS (unchanged, fulfillment lifecycle):
--   pending → confirmed → processing → completed
--                  ↓
--               cancelled
--
-- No payment provider is integrated here. The payment_state column
-- is intended to be updated server-side by a future payment provider
-- webhook/confirmation handler. Orders are created with payment_state
-- = 'pending', meaning payment has not been confirmed.
-- =====================================================

-- Step 1: Add payment_state column with constraint
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_state TEXT NOT NULL DEFAULT 'pending'
  CHECK (payment_state IN ('pending', 'paid', 'failed', 'refunded'));

-- Step 2: Index for payment_state lookups (useful for admin filtering)
CREATE INDEX IF NOT EXISTS idx_orders_payment_state
  ON public.orders(payment_state);

-- Step 3: Add city column to orders for delivery address granularity
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS city TEXT;

-- Step 4: Add city column to profiles so it can be prefilled
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city TEXT;
