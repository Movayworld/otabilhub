-- =====================================================
-- OtabilHub — Fix site_branding RLS + service hardening
-- =====================================================
-- The original SELECT policy queried site_branding from inside its
-- own USING clause, which Postgres reports as:
--   "infinite recursion detected in policy for relation site_branding"
-- This broke every read of the branding row (public favicon metadata
-- and the admin branding page), returning a 500 error.
--
-- Also adds an INSERT policy for admins so an upsert performed with an
-- authenticated admin session is permitted under RLS (the service
-- client bypasses RLS, but this keeps the table correct for both paths).

DROP POLICY IF EXISTS "Public can read active branding" ON public.site_branding;

CREATE POLICY "Public can read branding"
  ON public.site_branding FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "Admins can insert branding"
  ON public.site_branding FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

GRANT INSERT ON public.site_branding TO authenticated;
