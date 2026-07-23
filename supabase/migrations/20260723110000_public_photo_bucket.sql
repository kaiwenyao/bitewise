-- 修复:meal-photos 桶必须为公开读。
-- 若桶在 init 迁移之前被手动创建为私有,init 的 on conflict do nothing
-- 不会纠正它,导致照片公开 URL 返回 400,历史页缩略图加载失败
update storage.buckets set public = true where id = 'meal-photos';
