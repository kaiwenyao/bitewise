-- Bitewise 数据库结构
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 一餐 = 一条记录
create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  photo_url text
);

-- 一餐识别出的食物
create table if not exists food_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals(id) on delete cascade,
  name text not null,
  portion_grams int not null default 0,
  kcal_low int not null default 0,
  kcal_mid int not null default 0,
  kcal_high int not null default 0,
  position int not null default 0
);

create index if not exists meals_created_at_idx on meals (created_at desc);
create index if not exists food_items_meal_id_idx on food_items (meal_id);

-- 照片存储桶(公开读;写入走服务端 service_role,无需额外策略)
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do nothing;
