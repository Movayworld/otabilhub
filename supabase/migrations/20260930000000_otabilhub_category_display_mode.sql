-- =====================================================
-- OtabilHub — Category Display Mode Configuration
-- =====================================================
-- Adds display_mode to categories for homepage section rendering.
--   'grid'         — 2-column grid on homepage category section
--   'horizontal'   — horizontal swipe/carousel on homepage category section

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS display_mode TEXT CHECK (display_mode IN ('grid', 'horizontal')) DEFAULT 'grid';

CREATE INDEX IF NOT EXISTS idx_categories_display_mode ON public.categories(display_mode);

-- Set existing categories to 'grid' (the default)
UPDATE public.categories SET display_mode = 'grid' WHERE display_mode IS NULL;
