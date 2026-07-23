import { createBrowserClient } from "@supabase/ssr";

/**
 * 浏览器端 Supabase 客户端(publishable key,受 RLS 约束)。
 * 只用于登录/退出等会话操作;数据读写仍走 Route Handler。
 */
export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }
  return createBrowserClient(url, key);
}

/** 用户名映射为 Supabase Auth 邮箱(Auth 原生只支持邮箱登录) */
export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@bitewise.local`;

/** 从映射邮箱取回用户名 */
export const emailToUsername = (email: string) =>
  email.replace(/@bitewise\.local$/, "");
