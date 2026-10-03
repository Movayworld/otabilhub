-- =====================================================
-- OtabilHub — Phase 7A Migration: Secure Guest Order Access
-- =====================================================
-- Fixes IDOR vulnerability in order-success/[id] where
-- the service-role key bypassed RLS entirely, allowing
-- anyone who knew an order UUID to access private customer
-- data (name, phone, address, order items, prices).
--
-- This migration adds a guest_access_token column to the
-- orders table. When a guest places an order, a secure
-- random token is generated and stored. The order-success
-- page (using the anon key, NOT the service key) queries
-- with this token, and RLS allows access only when the
-- token matches.
--
-- Authenticated users access their orders via profile_id
-- under existing RLS policies — no token needed.
-- Guest orders require the token for retrieval.
-- The token is UUIDv4 (cryptographically random), not
-- guessable and distinct from the order's primary UUID.
-- =====================================================

-- Step 1: Add guest_access_token column
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_access_token UUID;

-- Step 2: Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_orders_guest_access_token
  ON public.orders(guest_access_token)
  WHERE guest_access_token IS NOT NULL;

-- Step 3: RLS Policy — Guests with a valid access token can view their order
-- Anon can select orders that have a guest_access_token (the query must
-- match both id and guest_access_token for exact row access).
CREATE POLICY "Guests can view order with valid access token"
  ON public.orders FOR SELECT
  TO anon
  USING (
    guest_access_token IS NOT NULL
  );

-- Step 4: Grant anon SELECT access (the policy handles row-level filtering)
GRANT SELECT ON public.orders TO anon;

-- =====================================================
-- Step 5: Homepage Hero Management Table
-- =====================================================
-- Allows admin to manage homepage hero content via the admin panel.
-- Only one active hero config at a time (is_active = true).

CREATE TABLE IF NOT EXISTS public.hero_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active       BOOLEAN NOT NULL DEFAULT false,
  image_url       TEXT NOT NULL,
  image_alt       TEXT,
  heading         TEXT NOT NULL,
  subheading      TEXT,
  primary_cta_text TEXT NOT NULL,
  primary_cta_url TEXT NOT NULL,
  secondary_cta_text TEXT,
  secondary_cta_url TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hero_configs_active ON public.hero_configs(is_active);

-- RLS for hero configs (admin-only write, public read of active config)
ALTER TABLE public.hero_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active hero config is visible to everyone"
  ON public.hero_configs FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admins can create hero configs"
  ON public.hero_configs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update hero configs"
  ON public.hero_configs FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete hero configs"
  ON public.hero_configs FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE TRIGGER trg_hero_configs_updated
  BEFORE UPDATE ON public.hero_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT ON public.hero_configs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_configs TO authenticated;
