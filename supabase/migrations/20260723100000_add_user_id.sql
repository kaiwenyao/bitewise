-- 用户系统:每条记录归属一个用户
-- 注意:此迁移前的历史数据 user_id 为 NULL,按用户过滤后不再可见;
-- 全新项目无历史数据,不受影响

alter table meals
  add column if not exists user_id uuid references auth.users(id);

-- 历史页查询模式:某用户按时间倒序翻页
create index if not exists meals_user_id_idx on meals (user_id, created_at desc);
