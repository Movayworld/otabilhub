-- =====================================================
-- OtabilHub — Add DELETE policy for contact_messages
-- =====================================================
-- Admins need to delete contact messages from the inbox.
-- The existing RLS has SELECT, INSERT, UPDATE but no DELETE.
-- This adds the smallest policy: admin-only DELETE.
-- =====================================================

CREATE POLICY "Admins can delete messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (is_admin());
