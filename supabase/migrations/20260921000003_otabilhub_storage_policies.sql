-- =====================================================
-- OtabilHub — Storage RLS Policies
-- =====================================================
-- Adds RLS policies for storage buckets to allow
-- authenticated admin uploads and public reads.

-- Branding bucket policies
CREATE POLICY "Authenticated users can upload branding assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'branding');

CREATE POLICY "Public can read branding assets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'branding');

CREATE POLICY "Authenticated users can update branding assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'branding');

-- Product images bucket policies
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Public can read product images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');
