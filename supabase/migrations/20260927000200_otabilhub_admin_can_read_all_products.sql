-- =====================================================
-- OtabilHub — Admins must be able to read everything they manage
-- =====================================================
-- Postgres evaluates the SELECT policy against the NEW row whenever an
-- UPDATE runs with RETURNING (PostgREST always adds RETURNING for .update()
-- calls that select back data). Because the only products SELECT policy was
-- "Published products are visible to everyone" (is_published = true), an
-- admin could not unpublish a product:
--
--   update products set is_published = false ...
--   -> 42501 new row violates row-level security policy for table "products"
--
-- The same applies to product_images, whose only SELECT policy restricts
-- visibility to images of published products: the admin edit page for an
-- UNPUBLISHED (draft) product could not see or manage its images at all.
--
-- These policies only broaden visibility for authenticated admins, exactly
-- like the equivalent policies on categories, delivery_locations, orders,
-- newsletter_subscribers and service_requests. Public visibility is unchanged.

CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can view all product images"
  ON public.product_images FOR SELECT
  TO authenticated
  USING (is_admin());
