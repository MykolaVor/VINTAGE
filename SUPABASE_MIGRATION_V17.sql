-- VINTAGE v17: moderation + message highlights + admin RPCs
-- Run this once in Supabase SQL Editor.

create table if not exists public.user_moderation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('mute','ban')),
  reason text,
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  active boolean not null default true
);
create index if not exists user_moderation_user_active_idx on public.user_moderation(user_id, active, expires_at);
alter table public.chat_messages add column if not exists highlighted boolean not null default false;

create or replace function public.has_active_moderation(target_user uuid, moderation_type text default null)
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists(select 1 from public.user_moderation m where m.user_id=target_user and m.active=true and (m.expires_at is null or m.expires_at>now()) and (moderation_type is null or m.type=moderation_type));
$$;
create or replace function public.chat_can_post(target_user uuid)
returns boolean language sql stable security definer set search_path=public,auth as $$
  select target_user is not null and not public.has_active_moderation(target_user,'mute') and not public.has_active_moderation(target_user,'ban');
$$;

drop policy if exists "Users can insert chat messages" on public.chat_messages;
drop policy if exists "Authenticated users can insert chat messages" on public.chat_messages;
drop policy if exists "Users can update own chat messages" on public.chat_messages;
create policy "Users can insert chat messages" on public.chat_messages for insert to authenticated with check (auth.uid()=user_id and public.chat_can_post(auth.uid()));
create policy "Users can update own chat highlight" on public.chat_messages for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);

create or replace function public.prevent_chat_message_edit() returns trigger language plpgsql security definer set search_path=public,auth as $$
begin
  if new.user_id<>old.user_id or new.message<>old.message or new.created_at<>old.created_at then raise exception 'Chat message content cannot be edited'; end if;
  return new;
end; $$;
drop trigger if exists prevent_chat_message_edit on public.chat_messages;
create trigger prevent_chat_message_edit before update on public.chat_messages for each row execute function public.prevent_chat_message_edit();

create or replace function public.admin_list_users()
returns table(id uuid,email text,username text,minecraft_nickname text,role text,created_at timestamptz,mute_until timestamptz,ban_until timestamptz,mute_reason text,ban_reason text)
language plpgsql security definer set search_path=public,auth as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  return query select u.id,u.email::text,p.username,p.minecraft_nickname,p.role,u.created_at,
    (select m.expires_at from public.user_moderation m where m.user_id=u.id and m.active and m.type='mute' and (m.expires_at is null or m.expires_at>now()) order by m.created_at desc limit 1),
    (select m.expires_at from public.user_moderation m where m.user_id=u.id and m.active and m.type='ban' and (m.expires_at is null or m.expires_at>now()) order by m.created_at desc limit 1),
    (select m.reason from public.user_moderation m where m.user_id=u.id and m.active and m.type='mute' and (m.expires_at is null or m.expires_at>now()) order by m.created_at desc limit 1),
    (select m.reason from public.user_moderation m where m.user_id=u.id and m.active and m.type='ban' and (m.expires_at is null or m.expires_at>now()) order by m.created_at desc limit 1)
  from auth.users u left join public.profiles p on p.id=u.id order by u.created_at desc;
end; $$;

create or replace function public.admin_set_moderation(target_user uuid, moderation_type text, duration_minutes integer, moderation_reason text default null)
returns void language plpgsql security definer set search_path=public,auth as $$
declare expires_at_value timestamptz;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if moderation_type not in ('mute','ban') then raise exception 'Invalid moderation type'; end if;
  if duration_minutes is null or duration_minutes=0 then expires_at_value:=null; elsif duration_minutes<0 then raise exception 'Invalid duration'; else expires_at_value:=now()+make_interval(mins=>duration_minutes); end if;
  update public.user_moderation set active=false where user_id=target_user and type=moderation_type and active=true;
  insert into public.user_moderation(user_id,type,reason,expires_at,created_by) values(target_user,moderation_type,moderation_reason,expires_at_value,auth.uid());
end; $$;

create or replace function public.admin_clear_moderation(target_user uuid, moderation_type text)
returns void language plpgsql security definer set search_path=public,auth as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if moderation_type not in ('mute','ban') then raise exception 'Invalid moderation type'; end if;
  update public.user_moderation set active=false where user_id=target_user and type=moderation_type and active=true;
end; $$;

alter table public.user_moderation enable row level security;
drop policy if exists "Admins can manage moderation" on public.user_moderation;
create policy "Admins can manage moderation" on public.user_moderation for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_moderation(uuid,text,integer,text) to authenticated;
grant execute on function public.admin_clear_moderation(uuid,text) to authenticated;
grant execute on function public.chat_can_post(uuid) to authenticated;
