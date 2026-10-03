-- =====================================================
-- OtabilHub — Branding Configuration Migration
-- =====================================================
-- Adds a single-row configuration table for site branding
-- (favicon/app icon) stored in Supabase Storage.

CREATE TABLE IF NOT EXISTS public.site_branding (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_path   TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_branding_active
  ON public.site_branding(id);

ALTER TABLE public.site_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active branding"
  ON public.site_branding FOR SELECT
  TO anon, authenticated
  USING ( EXISTS (SELECT 1 FROM public.site_branding LIMIT 1) );

CREATE POLICY "Admins can update branding"
  ON public.site_branding FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER trg_site_branding_updated
  BEFORE UPDATE ON public.site_branding
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT ON public.site_branding TO anon;
GRANT SELECT, UPDATE ON public.site_branding TO authenticated;

INSERT INTO public.site_branding (id, icon_path)
VALUES ('00000000-0000-0000-0000-000000000001', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  TRUE,
  2097152,
  ARRAY['image/png', 'image/x-icon']
)
ON CONFLICT (id) DO NOTHING;
