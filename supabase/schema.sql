-- Moguru β版 データベース設定
-- Supabase の「SQL Editor」に全文を貼り付けて「Run」を押してください（1回だけ）。

-- ===== テーブル =====

-- 店舗（1アカウント1台）
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,20}$'),
  name text not null check (char_length(name) between 1 and 40),
  genre text not null default 'other',
  brand_color text not null default '#F76B15' check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  logo_url text,
  photo_url text,
  allergy_tags text[] not null default '{}',
  instagram text,
  created_at timestamptz not null default now()
);

-- 出店予定（住所なし・エリア名だけ）
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  area text not null check (char_length(area) between 1 and 60),
  memo text,
  created_at timestamptz not null default now()
);
create index if not exists schedules_store_date on public.schedules (store_id, date);

-- 出店記録（「出店開始」で1行。終了すると ended_at が入る）
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  schedule_id uuid references public.schedules (id) on delete set null,
  lat double precision not null,
  lng double precision not null,
  accuracy real,
  area text,
  end_label text,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  auto_close_at timestamptz not null,
  ended_at timestamptz
);
create index if not exists sessions_open on public.sessions (store_id) where ended_at is null;

-- 閲覧数（個人を特定する情報は持たない）
create table if not exists public.page_views (
  store_id uuid not null references public.stores (id) on delete cascade,
  day date not null,
  views integer not null default 0,
  route_taps integer not null default 0,
  primary key (store_id, day)
);

-- ===== アクセス制御 =====
alter table public.stores enable row level security;
alter table public.schedules enable row level security;
alter table public.sessions enable row level security;
alter table public.page_views enable row level security;

-- 誰でも読める（お客さん画面用）。書けるのは自分の店だけ
drop policy if exists stores_read on public.stores;
create policy stores_read on public.stores for select using (true);
drop policy if exists stores_insert on public.stores;
create policy stores_insert on public.stores for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists stores_update on public.stores;
create policy stores_update on public.stores for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists schedules_read on public.schedules;
create policy schedules_read on public.schedules for select using (true);
drop policy if exists schedules_write on public.schedules;
create policy schedules_write on public.schedules for all to authenticated
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));

drop policy if exists sessions_read on public.sessions;
create policy sessions_read on public.sessions for select using (true);
drop policy if exists sessions_write on public.sessions;
create policy sessions_write on public.sessions for all to authenticated
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));

drop policy if exists page_views_owner on public.page_views;
create policy page_views_owner on public.page_views for select to authenticated
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));

-- 閲覧数を1増やす（お客さん画面から呼ぶ。ログイン不要）
create or replace function public.bump_view(p_slug text, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  select id into sid from public.stores where slug = p_slug;
  if sid is null then return; end if;
  insert into public.page_views (store_id, day, views, route_taps)
  values (sid, (now() at time zone 'Asia/Tokyo')::date,
          case when p_kind = 'view' then 1 else 0 end,
          case when p_kind = 'route' then 1 else 0 end)
  on conflict (store_id, day) do update set
    views = page_views.views + excluded.views,
    route_taps = page_views.route_taps + excluded.route_taps;
end; $$;
grant execute on function public.bump_view(text, text) to anon, authenticated;

-- 出店の変化をお客さんの画面にすぐ届ける
do $$ begin
  alter publication supabase_realtime add table public.sessions;
exception when duplicate_object then null; end $$;

-- ===== 画像の保存場所（ロゴ・看板メニュー写真） =====
insert into storage.buckets (id, name, public) values ('store-images', 'store-images', true)
on conflict (id) do nothing;

drop policy if exists store_images_insert on storage.objects;
create policy store_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'store-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists store_images_update on storage.objects;
create policy store_images_update on storage.objects for update to authenticated
  using (bucket_id = 'store-images' and (storage.foldername(name))[1] = auth.uid()::text);
