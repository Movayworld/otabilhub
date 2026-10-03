-- =====================================================
-- OtabilHub — Newsletter Subscribers Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  unsubscribe_token UUID DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON public.newsletter_subscribers(is_active);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can view own subscription"
  ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all subscribers"
  ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (email IS NOT NULL);

CREATE POLICY "Admins can update subscribers"
  ON public.newsletter_subscribers FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete subscribers"
  ON public.newsletter_subscribers FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE TRIGGER trg_newsletter_subscribers_updated
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;

-- =====================================================
-- OtabilHub — Contact Messages Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  subject     TEXT,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (email = (auth.jwt() ->> 'email'));

CREATE POLICY "Admins can view all messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Anyone can submit a message"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (name IS NOT NULL AND email IS NOT NULL AND message IS NOT NULL);

CREATE POLICY "Admins can update messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER trg_contact_messages_updated
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
