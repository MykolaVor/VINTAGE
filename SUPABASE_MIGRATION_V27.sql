-- VINTAGE v27: profile settings + public stats/skin helpers
alter table public.profiles add column if not exists discord_username text;
alter table public.profiles add column if not exists bio text;

-- Keep role protected while allowing each user to update their own profile fields.
create schema if not exists private;

create or replace function private.current_user_role()
returns text language sql security definer set search_path = public stable as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = private.current_user_role());

create or replace function public.get_public_player_profiles()
returns table (id uuid, username text, minecraft_nickname text, role text, whitelist_approved boolean)
language sql security definer set search_path = public as $$
  select p.id, p.username, coalesce(a.minecraft_nickname, p.minecraft_nickname), p.role, (a.id is not null)
  from public.profiles p
  left join lateral (select wa.id, wa.minecraft_nickname from public.whitelist_applications wa where wa.user_id=p.id and wa.status='approved' order by wa.created_at desc limit 1) a on true
  order by p.created_at asc;
$$;
grant execute on function public.get_public_player_profiles() to authenticated;

create or replace function public.get_public_server_stats()
returns table (registered_players bigint, approved_players bigint, chat_messages bigint, whitelist_applications bigint)
language sql security definer set search_path = public as $$
  select (select count(*) from public.profiles), (select count(*) from public.whitelist_applications where status='approved'), (select count(*) from public.chat_messages), (select count(*) from public.whitelist_applications);
$$;
grant execute on function public.get_public_server_stats() to anon, authenticated;

-- Keep the helper out of the public API surface.
revoke all on function private.current_user_role() from public;
drop function if exists public.current_user_role();

-- Admin RPCs are never intended for anonymous callers.
revoke execute on function public.admin_clear_moderation(uuid,text) from anon;
revoke execute on function public.admin_list_users() from anon;
revoke execute on function public.admin_set_moderation(uuid,text,integer,text) from anon;
revoke execute on function public.is_admin() from anon;
