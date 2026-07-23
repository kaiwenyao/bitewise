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
pnpm supabase login          # 首次使用,见「数据库迁移」一节
pnpm supabase link --project-ref <项目ref>
pnpm db:push                 # 建表 + 建存储桶
pnpm db:seed                 # 创建默认用户 admin / 123456
pnpm dev
```

## 环境变量

见 `.env.example`。`SUPABASE_SECRET_KEY` 和 `MINIMAX_API_KEY` 仅在服务端使用,不要加 `NEXT_PUBLIC_` 前缀。

## 用户系统

- 用 **Supabase Auth** 做用户名 + 密码登录:Auth 原生只支持邮箱,所以用户名映射为 `用户名@bitewise.local`(如 `admin` → `admin@bitewise.local`),映射逻辑在 `lib/supabase-browser.ts`
- `middleware.ts` 保护所有页面和 `/api/*`:未登录访问页面跳 `/login`,访问 API 返回 401;已登录访问 `/login` 跳回 `/capture`
- 数据按用户隔离:`meals.user_id` 记录归属,保存时取会话用户写入,历史页按 `user_id` 过滤(服务端用 sb_secret 查询,所以**必须**在代码里过滤,不能省)
- 默认用户:`pnpm db:seed` 创建 `admin / 123456`(幂等)。**上线前务必改密码**——目前只能去 Supabase Dashboard → Authentication → Users 里改,或再建新用户
- 新增用户:Dashboard → Authentication → Users → Add user,邮箱填 `新名字@bitewise.local`

---

## 数据库迁移:Supabase CLI 完全指南

### 它是什么、怎么工作的

Supabase CLI 是官方命令行工具,本项目用它做 **Flyway 式的数据库版本管理**。它已经装在项目的 devDependencies 里,不需要全局安装,所有命令通过 `pnpm supabase ...` 调用。

工作机制和 Flyway 完全同构:

- **迁移文件**:`supabase/migrations/<时间戳>_<名字>.sql`。CLI 按文件名排序执行,所以时间戳前缀就是版本号,保证顺序
- **版本表**:远端数据库里有一张 `supabase_migrations.schema_migrations` 表(相当于 Flyway 的 `flyway_schema_history`),记录哪些迁移已经执行过
- **push 时**:CLI 对比「本地文件列表」和「版本表」,只执行表里还没有的文件,执行完把版本号插进版本表。重复执行安全(幂等),不会重复建表

铁律:**已推送过的迁移文件绝不修改**。要改表结构就新建一个迁移文件。改了旧文件会导致本地和远端的版本记录对不上,push 直接报错。

### 一次性设置(每条命令逐行解释)

```bash
pnpm supabase login
```

让 CLI 获得操作你账号的权限。执行后弹出浏览器登录 Supabase,拿到 access token 存在本机(`~/Library/Application Support/supabase`)。只需做一次。CI 环境没有浏览器,改用环境变量 `SUPABASE_ACCESS_TOKEN`(在 Dashboard → Account → Access Tokens 生成)。

```bash
pnpm supabase link --project-ref abcdefghijklmn
```

把本地这个目录和你的云项目**绑定**起来,之后的命令才知道往哪个项目推。

- `--project-ref` 是项目 ID:Dashboard 首页 URL 里 `supabase.com/dashboard/project/<这一段>`,或 Settings → General → Reference ID
- 执行时会提示输入**数据库密码**(创建项目时设的那个;忘了去 Settings → Database → Reset password)
- 绑定结果写入 `supabase/config.toml`(不含密钥,可以提交)

```bash
pnpm db:push
```

等于 `pnpm supabase db push`(在 package.json 里定义了别名)。做三件事:

1. 扫描 `supabase/migrations/` 下所有 `.sql` 文件,按文件名排序
2. 连远端数据库查 `supabase_migrations.schema_migrations`,算出「本地有、远端没执行过」的差集
3. 逐个在事务里执行差集文件,每成功一个就往版本表插一条记录;中途失败会回滚当前文件并停下,不会留半个迁移

首次执行就是把 `20260723000000_init.sql` 推上去:建 `meals`、`food_items` 两张表和 `meal-photos` 存储桶。

### 日常开发:改表结构的标准流程

第一步,生成新迁移文件:

```bash
pnpm db:new add_note_to_meals
```

等于 `pnpm supabase migration new add_note_to_meals`。在 `supabase/migrations/` 下生成一个空文件,比如 `20260724103015_add_note_to_meals.sql`——时间戳自动生成保证顺序,你只需往里面写 SQL:

```sql
alter table meals add column note text;
```

第二步,推到远端:

```bash
pnpm db:push
```

这次只会执行新增的那一个文件,之前已应用的自动跳过。

随时查看状态:

```bash
pnpm db:status
```

等于 `pnpm supabase migration list`。左右两列对比本地文件和远端版本表,一眼看出哪些迁移已应用、哪些还没推。

### 初始迁移 SQL 逐行解释(`20260723000000_init.sql`)

```sql
create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  photo_url text
);
```

一餐一条记录。

- `id uuid primary key default gen_random_uuid()`:主键用 UUID,由 Postgres 的 `gen_random_uuid()` 自动生成,插入时不用给值
- `created_at timestamptz not null default now()`:带时区的创建时间,默认当前时间。历史页按它倒序、按天分组
- `photo_url text`:照片在 Storage 里的公开地址。图片本体不进数据库,库里只存这个字符串;允许 NULL

```sql
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
```

一餐识别出的每个食物一行。

- `meal_id ... references meals(id) on delete cascade`:外键指向 `meals`;`on delete cascade` 表示删掉一餐时,它的食物项跟着一起删,不留孤儿行
- `kcal_low / kcal_mid / kcal_high`:热量的诚实区间(下限/中值/上限),不存伪精确的单值
- `position`:食物在一餐里的顺序,保持 AI 返回的次序,展示不乱

```sql
create index if not exists meals_created_at_idx on meals (created_at desc);
create index if not exists food_items_meal_id_idx on food_items (meal_id);
```

两个索引:

- 第一个:历史页「按时间倒序 + 分页」的查询模式,有索引就不用每次全表排序
- 第二个:按 `meal_id` 查一餐的所有食物项(history 接口的 join),走索引而不是逐行扫描

```sql
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do nothing;
```

创建照片存储桶。Supabase 的桶就是 `storage.buckets` 系统表里的一行,所以用 SQL 插入即创建:

- `public = true`:知道 URL 就能读图。URL 路径含 UUID 不可枚举,单用户场景够用;以后做多用户再改私有桶 + 签名 URL
- `on conflict (id) do nothing`:桶已存在就跳过,保证迁移重复执行不报错(幂等)

### 常见问题

- **push 报版本不一致**:你改了已推送的旧迁移文件。把旧文件恢复原样,改动写成新的迁移文件再 push
- **想在本地起一个完整 Supabase 做测试**:`pnpm supabase start`(需要 Docker),会给你一套本地数据库 + Storage,迁移用 `pnpm supabase db reset` 在本地重演。可选,不影响上面的云流程
- **密钥安全**:数据库密码、access token、`sb_secret_` 密钥都不进 git;`supabase/config.toml` 本身不含密钥,可以提交

---

## 照片的生命周期

1. 拍照/选图后,浏览器内压缩(长边 1600px、JPEG 0.8,约 200–500KB)
2. 压缩图送 `/api/recognize` 识别 —— 此阶段**不落盘**
3. 用户点「保存到今天」时,照片才上传 Storage 并写入 `meals.photo_url`

放弃的记录不会留下孤儿照片;Storage 里每张图都对应一条真实记录。
