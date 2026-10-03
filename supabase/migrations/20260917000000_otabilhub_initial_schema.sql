-- =====================================================
-- OtabilHub — Initial Database Schema (Phase 1)
-- =====================================================
-- Idempotent: safe to re-run

-- =====================================================
-- Drop existing objects (reverse order of creation)
-- =====================================================
-- Drop tables with CASCADE to also drop their triggers
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Drop trigger on auth.users (only if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    DROP TRIGGER on_auth_user_created ON auth.users;
  END IF;
END;
$$;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();

-- =====================================================
-- A clean relational schema for OtabilHub's e-commerce platform.
-- Tables: categories, admin_users, products, product_images,
--         profiles, orders, order_items, service_requests
-- =====================================================

-- =====================================================
-- Step 1: Tables
-- =====================================================

-- ---- Categories ----
CREATE TABLE public.categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Admin Users (admin flag table) ----
CREATE TABLE public.admin_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Products ----
CREATE TABLE public.products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  description       TEXT,
  short_description TEXT,
  price             NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price  NUMERIC(10,2) CHECK (compare_at_price >= 0),
  stock_quantity    INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_available      BOOLEAN NOT NULL DEFAULT TRUE,
  category_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  is_published      BOOLEAN NOT NULL DEFAULT FALSE,
  specifications    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Product Images ----
CREATE TABLE public.product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  alt_text    TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Customer Profiles ----
CREATE TABLE public.profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email     TEXT NOT NULL,
  phone     TEXT,
  address   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Orders ----
CREATE TABLE public.orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  total             NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  currency          TEXT NOT NULL DEFAULT 'GHS',
  shipping_address  TEXT,
  phone             TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Order Items ----
CREATE TABLE public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  product_price NUMERIC(10,2) NOT NULL CHECK (product_price >= 0),
  quantity      INTEGER NOT NULL CHECK (quantity >= 1),
  total_price   NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Service / Installation Requests ----
CREATE TABLE public.service_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_id      UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  service_type  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'cancelled')),
  scheduled_at  TIMESTAMPTZ,
  address       TEXT,
  notes         TEXT,
  price         NUMERIC(10,2) CHECK (price >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Step 2: Indexes
-- =====================================================

CREATE INDEX idx_products_category    ON public.products(category_id);
CREATE INDEX idx_products_featured    ON public.products(is_featured) WHERE is_featured;
CREATE INDEX idx_products_published   ON public.products(is_published);
CREATE INDEX idx_products_spec_gin    ON public.products USING GIN (specifications);

CREATE INDEX idx_product_images_product ON public.product_images(product_id);
CREATE INDEX idx_product_images_primary ON public.product_images(product_id) WHERE is_primary;

CREATE INDEX idx_order_items_order  ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

CREATE INDEX idx_orders_profile   ON public.orders(profile_id);
CREATE INDEX idx_orders_status    ON public.orders(status);
CREATE INDEX idx_orders_created   ON public.orders(created_at);

CREATE INDEX idx_service_requests_profile ON public.service_requests(profile_id);
CREATE INDEX idx_service_requests_status  ON public.service_requests(status);
CREATE INDEX idx_service_requests_created ON public.service_requests(created_at);

-- =====================================================
-- Step 3: Helper Functions (after tables exist)
-- =====================================================

-- Check if the current authenticated user is an admin.
-- SECURITY DEFINER bypasses RLS on admin_users when called
-- from within other table policies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.id = auth.uid()
  );
$$;

-- Auto-populate updated_at on row updates.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Auto-create a profile row when a new auth user is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;

-- =====================================================
-- Step 4: Triggers
-- =====================================================

CREATE TRIGGER trg_categories_updated
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_service_requests_updated
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Step 5: Row Level Security
-- =====================================================

ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests  ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Step 6: RLS Policies
-- =====================================================

-- ---- Categories ----
CREATE POLICY "Active categories are visible to everyone"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admins can create categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (is_admin());

-- ---- Products ----
CREATE POLICY "Published products are visible to everyone"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

CREATE POLICY "Admins can create products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (is_admin());

-- ---- Product Images ----
CREATE POLICY "Product images visible for published products"
  ON public.product_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_images.product_id AND is_published = TRUE
    )
  );

CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update product images"
  ON public.product_images FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete product images"
  ON public.product_images FOR DELETE
  TO authenticated
  USING (is_admin());

-- ---- Profiles ----
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (is_admin());

-- ---- Admin Users ----
CREATE POLICY "Users can check own admin status"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all admin users"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can add admin users"
  ON public.admin_users FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete admin users"
  ON public.admin_users FOR DELETE
  TO authenticated
  USING (is_admin());

-- ---- Orders ----
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (is_admin());

-- ---- Order Items ----
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id
      AND (profile_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Admins can manage order items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update order items"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete order items"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (is_admin());

-- ---- Service Requests ----
CREATE POLICY "Users can view own service requests"
  ON public.service_requests FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR is_admin()
  );

CREATE POLICY "Admins can view all service requests"
  ON public.service_requests FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Authenticated users can create service requests"
  ON public.service_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = auth.uid() OR is_admin()
  );

CREATE POLICY "Admins can update service requests"
  ON public.service_requests FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete service requests"
  ON public.service_requests FOR DELETE
  TO authenticated
  USING (is_admin());

-- =====================================================
-- Step 7: Grant Permissions
-- =====================================================

-- Public (unauthenticated) read access to published data
GRANT SELECT ON public.categories, public.products, public.product_images TO anon;

-- Authenticated users can read published data
GRANT SELECT ON public.categories, public.products, public.product_images TO authenticated;

-- Authenticated users can manage their own data + admin actions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_requests TO authenticated;

-- Usage on sequences and functions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- Step 8: Storage Bucket
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  TRUE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
