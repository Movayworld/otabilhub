-- =====================================================
-- OtabilHub — Ensure storage buckets are public
-- =====================================================
-- The favicon (icon) uploaded via the branding admin page is rendered
-- directly by the browser via <link rel="icon"> in the HTML <head>.
-- Unlike Next.js Image optimization (which proxies through the app),
-- the browser fetches this URL directly, so the storage bucket MUST
-- be public for the favicon to render.
--
-- The hero image works because it is served through next/image
-- (optimized proxy), but the favicon is a raw URL in metadata.
--
-- This also ensures product-images are public for direct fetches
-- (e.g. in emails, meta tags, or non-Next.js consumers).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('branding', 'branding', true, 2097152, ARRAY['image/png', 'image/x-icon', 'image/jpeg', 'image/jpg'])
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET public = true;
