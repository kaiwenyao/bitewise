/**
 * 创建默认用户 admin / 123456(幂等,已存在则跳过)。
 * 用法:pnpm db:seed(需要 .env.local 里有 SUPABASE 两个密钥)
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SECRET_KEY,请检查 .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = "admin@bitewise.local"; // 登录页用户名 admin 会映射到这个邮箱
const password = "123456";

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // 跳过邮箱验证,直接可登录
});

if (error) {
  if (error.message.toLowerCase().includes("already")) {
    console.log("admin 用户已存在,跳过");
  } else {
    console.error("创建失败:", error.message);
    process.exit(1);
  }
} else {
  console.log(`已创建 admin 用户(${email}),id: ${data.user.id}`);
  console.log("请登录后到个人页修改默认密码!");
}
