-- =====================================================
-- OtabilHub — Phase 3A-C Fix: Guest Order RLS Security
-- =====================================================
-- Removes the overly broad anonymous SELECT policy that allowed
-- any anonymous user to view any guest order simply because
-- guest_access_token IS NOT NULL.
--
-- Security now relies on query-level filtering in
-- src/app/order-success/[id]/page.tsx which requires matching
-- BOTH order id AND guest_access_token. The service client
-- (service role key) bypasses RLS, so the application layer
-- is the security boundary for guest order retrieval.
--
-- The guest access token is passed via URL query parameter
-- (not JWT), so no RLS policy can verify token ownership at
-- the database level. Application-layer verification in both
-- the order page and cancelOrder action ensures:
-- 1. Order lookup requires exact id + token match
-- 2. Cancellation requires token verification before any
--    state changes or stock operations
-- =====================================================

DROP POLICY IF EXISTS "Guests can view order with valid access token"
  ON public.orders;
