-- =====================================================
-- OtabilHub — Phase 5 Migration: Allow Guest Checkout
-- =====================================================
-- The orders table currently has profile_id NOT NULL, which prevents
-- guest checkout (unauthenticated order creation).
-- This migration allows profile_id to be nullable, enabling
-- unauthenticated customers to place orders through the
-- server-side order creation endpoint that uses the service role key.
-- The profile_id column is retained for authenticated users.
-- =====================================================

-- Allow NULL profile_id for guest orders
ALTER TABLE public.orders
  ALTER COLUMN profile_id DROP NOT NULL;
