-- =====================================================
-- OtabilHub — Admins must see inactive categories
-- =====================================================
-- The only SELECT policy on categories was:
--   "Active categories are visible to everyone" USING (is_active = TRUE)
-- Because that policy also applies to authenticated admins, deactivating a
-- category from Admin -> Categories made the row invisible to the admin UI.
-- The category could then never be reactivated, edited, or deleted, and it
-- silently vanished from the catalogue manager.
--
-- delivery_locations already has the equivalent admin policy; categories did
-- not. This adds it without changing what the public storefront can see.

CREATE POLICY "Admins can view all categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (is_admin());
