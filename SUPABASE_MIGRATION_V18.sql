-- VINTAGE v18: chat edit/delete + unambiguous whitelist relations
-- Run once in Supabase SQL Editor.

DROP POLICY IF EXISTS "Users can update own chat highlight" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can update chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can delete chat messages" ON public.chat_messages;

CREATE POLICY "Users can update own chat messages"
ON public.chat_messages FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update chat messages"
ON public.chat_messages FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can delete own chat messages"
ON public.chat_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete chat messages"
ON public.chat_messages FOR DELETE TO authenticated
USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.prevent_chat_message_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,auth
AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Chat message owner and creation time cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

-- Allow realtime clients to receive whitelist changes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'whitelist_applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.whitelist_applications;
  END IF;
END $$;
