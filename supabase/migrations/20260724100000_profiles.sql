-- 用户资料:每日摄入目标(单一 kcal 值)
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_kcal_goal integer not null default 2000
    check (daily_kcal_goal between 500 and 10000),
  updated_at timestamptz not null default now()
);
