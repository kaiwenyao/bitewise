# Bitewise

拍一张,记下这一餐。Neo-Brutalism 风格的热量记录 PWA:拍照 → MiniMax 视觉识别 → Supabase 存取。

## 技术栈

- Next.js 14(App Router)+ Tailwind CSS,包管理用 pnpm
- Supabase:Postgres(`meals` / `food_items`)+ Storage(`meal-photos` 桶)
- MiniMax Token Plan 视觉端点(`/v1/coding_plan/vlm`)做食物识别
- 所有密钥只存在于服务端 Route Handler,浏览器只拿到压缩后的图片和 JSON

## 本地启动

```bash
pnpm install
cp .env.example .env.local   # 填入 Supabase / MiniMax 密钥
pnpm db:push                 # 初始化数据库(见下)
pnpm dev
```

## 环境变量

见 `.env.example`。`SUPABASE_SERVICE_ROLE_KEY` 和 `MINIMAX_API_KEY` 仅在服务端使用,不要加 `NEXT_PUBLIC_` 前缀。

## 数据库迁移(Flyway 式)

用 [Supabase CLI](https://supabase.com/docs/guides/cli) 管理,思路和 Flyway 一样:

- 迁移文件在 `supabase/migrations/<时间戳>_<名字>.sql`,按文件名顺序执行
- 已应用的版本记录在数据库的 `supabase_migrations.schema_migrations` 表,重复执行会跳过
- 首次先链接项目(只需一次):`pnpm supabase link --project-ref <项目ref>`

```bash
pnpm db:new add_xxx   # 新建空迁移文件,写 SQL
pnpm db:push          # 把本地未应用的迁移推到远端并记录版本
pnpm db:status        # 查看本地/远端迁移状态
```

规则:**改表结构只新增迁移文件,绝不改动已推送的旧文件**,否则版本校验会对不上。

## 照片的生命周期

1. 拍照/选图后,浏览器内压缩(长边 1600px、JPEG 0.8,约 200–500KB)
2. 压缩图送 `/api/recognize` 识别 —— 此阶段**不落盘**
3. 用户点「保存到今天」时,照片才上传 Storage 并写入 `meals.photo_url`

放弃的记录不会留下孤儿照片;Storage 里每张图都对应一条真实记录。
