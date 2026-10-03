-- =====================================================
-- OtabilHub — Homepage Layout + Product Card Configuration
-- =====================================================
-- Adds:
--   - display_order to categories for homepage positioning
--   - homepage_section to products for placement control
--   - card_layout to products for admin-selectable card style
--   - image_aspect_ratio preferences

-- ---- Category display ordering ----
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON public.categories(is_active, display_order);

-- Set sequential display_order for existing categories
DO $$
DECLARE
  r RECORD;
  counter INTEGER := 0;
BEGIN
  FOR r IN SELECT id FROM public.categories ORDER BY name
  LOOP
    UPDATE public.categories SET display_order = counter WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- ---- Product homepage positioning + card layout ----
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS homepage_section TEXT CHECK (homepage_section IN ('hero', 'featured', 'category', 'all')) DEFAULT 'featured',
  ADD COLUMN IF NOT EXISTS card_layout TEXT CHECK (card_layout IN ('standard', 'featured', 'compact')) DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS homepage_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_homepage ON public.products(is_published, is_available) WHERE homepage_section IN ('hero', 'featured');
CREATE INDEX IF NOT EXISTS idx_products_homepage_order ON public.products(homepage_section, homepage_order);

-- ---- Homepage layout config (singleton) ----
CREATE TABLE IF NOT EXISTS public.homepage_layout (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_config    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.homepage_layout (id, layout_config)
VALUES ('00000000-0000-0000-0000-000000000002', '{}')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_homepage_layout ON public.homepage_layout(id);
