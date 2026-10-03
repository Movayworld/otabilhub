-- =====================================================
-- OtabilHub — Phase 9 Seed: Bootstrap Admin User
-- =====================================================
-- This migration adds the first admin user (shopauraigh@gmail.com).
--
-- The user was created via the Supabase Auth signup endpoint
-- with email shopauraigh@gmail.com.
--
-- User ID: 5810c4fd-2d34-4faa-94f0-cf010a95d810
--
-- This migration runs as part of db push. If it is not applied
-- (e.g., due to service_role key issues), run this SQL manually
-- in the Supabase SQL Editor:
--
--   INSERT INTO admin_users (id)
--     VALUES ('5810c4fd-2d34-4faa-94f0-cf010a95d810')
--     ON CONFLICT (id) DO NOTHING;
-- =====================================================

INSERT INTO admin_users (id)
  VALUES ('5810c4fd-2d34-4faa-94f0-cf010a95d810')
  ON CONFLICT (id) DO NOTHING;
