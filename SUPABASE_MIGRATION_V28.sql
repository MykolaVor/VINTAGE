-- VINTAGE v28: show Discord + bio in admin player profiles, hide email from UI
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE FUNCTION public.admin_list_users()
RETURNS TABLE(
  id uuid,
  email text,
  username text,
  minecraft_nickname text,
  discord_username text,
  bio text,
  role text,
  created_at timestamptz,
  mute_until timestamptz,
  ban_until timestamptz,
  mute_reason text,
  ban_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT u.id, u.email::text, p.username, p.minecraft_nickname,
         p.discord_username, p.bio, p.role, u.created_at,
         (SELECT m.expires_at FROM public.user_moderation m WHERE m.user_id=u.id AND m.active=true AND m.type='mute' AND (m.expires_at IS NULL OR m.expires_at>now()) ORDER BY m.created_at DESC LIMIT 1),
         (SELECT m.expires_at FROM public.user_moderation m WHERE m.user_id=u.id AND m.active=true AND m.type='ban' AND (m.expires_at IS NULL OR m.expires_at>now()) ORDER BY m.created_at DESC LIMIT 1),
         (SELECT m.reason FROM public.user_moderation m WHERE m.user_id=u.id AND m.active=true AND m.type='mute' AND (m.expires_at IS NULL OR m.expires_at>now()) ORDER BY m.created_at DESC LIMIT 1),
         (SELECT m.reason FROM public.user_moderation m WHERE m.user_id=u.id AND m.active=true AND m.type='ban' AND (m.expires_at IS NULL OR m.expires_at>now()) ORDER BY m.created_at DESC LIMIT 1)
  FROM auth.users u LEFT JOIN public.profiles p ON p.id=u.id
  ORDER BY u.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
