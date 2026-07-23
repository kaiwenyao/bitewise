import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

/**
 * 服务端会话客户端(读用户 JWT,不带管理权限)。
 * 仅在 Route Handler / Server Component 中使用;
 * token 刷新由 middleware 负责,这里只读 cookie。
 */
export function getSupabaseSession() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }
  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });
}

/** 当前登录用户;未登录返回 null */
export async function getSessionUser(): Promise<User | null> {
  const {
    data: { user },
  } = await getSupabaseSession().auth.getUser();
  return user;
}
