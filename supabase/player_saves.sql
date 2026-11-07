-- Run in Supabase Dashboard > SQL Editor before enabling account cloud saves.
create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.player_saves enable row level security;
revoke all on public.player_saves from anon;
grant select, insert, update on public.player_saves to authenticated;
drop policy if exists "Players can read own save" on public.player_saves;
drop policy if exists "Players can insert own save" on public.player_saves;
drop policy if exists "Players can update own save" on public.player_saves;
create policy "Players can read own save" on public.player_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "Players can insert own save" on public.player_saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Players can update own save" on public.player_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
