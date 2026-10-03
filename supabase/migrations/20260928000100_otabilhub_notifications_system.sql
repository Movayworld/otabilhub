-- =====================================================
-- OtabilHub — Notification System + Customer IDs
-- =====================================================
-- Adds infrastructure for order notifications (email/SMS),
-- customer unique IDs for search, and order status history.

-- ---- Notification settings (admin-configurable) ----
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email     TEXT,
  admin_phone     TEXT,
  smtp_host       TEXT,
  smtp_port       INTEGER,
  smtp_user       TEXT,
  smtp_pass       TEXT,
  smtp_from       TEXT,
  twilio_sid      TEXT,
  twilio_token    TEXT,
  twilio_from     TEXT,
  email_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  on_new_order    BOOLEAN NOT NULL DEFAULT TRUE,
  on_status_change BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Order status history ----
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status_from TEXT,
  status_to   TEXT NOT NULL,
  changed_by  UUID REFERENCES auth.users(id),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id);

-- ---- Add customer_id to profiles for search ----
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS customer_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_customer_id ON public.profiles(customer_id);

-- Generate customer IDs for existing users (format: CUST-XXXXXX)
-- This uses a function to generate sequential IDs
DO $$
DECLARE
  r RECORD;
  counter INTEGER := 1;
  new_id TEXT;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE customer_id IS NULL ORDER BY created_at
  LOOP
    new_id := 'CUST-' || LPAD(counter::TEXT, 6, '0');
    UPDATE public.profiles SET customer_id = new_id WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- ---- Notifications log ----
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('email', 'sms', 'admin')),
  recipient     TEXT NOT NULL,
  subject       TEXT,
  message       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_order ON public.notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
