import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 会话刷新 + 路由保护:
 * - 未登录访问页面 → /login;访问 /api/* → 401
 * - 已登录访问 /login → /capture
 * 未配置 Supabase 环境变量时跳过鉴权(方便纯前端开发)。
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return response;
  }

  if (!user && pathname !== "/login") {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    return NextResponse.redirect(redirect);
  }
  if (user && pathname === "/login") {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/capture";
    return NextResponse.redirect(redirect);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
