-- =====================================================
-- OtabilHub — Allow admins to delete storage objects
-- =====================================================
-- storage.objects had INSERT / UPDATE / SELECT policies for the branding and
-- product-images buckets, but no DELETE policy. As a result, when an admin
-- deleted a product image the database row was removed while the underlying
-- storage object was silently left behind (orphaned asset, permanently
-- consuming storage and remaining publicly reachable).
--
-- deleteProductImage() calls storage.remove(), which was rejected by RLS.

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can delete branding assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'branding' AND public.is_admin());
