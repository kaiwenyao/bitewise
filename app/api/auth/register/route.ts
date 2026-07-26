import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { usernameToEmail } from "@/lib/supabase-browser";

export const runtime = "nodejs";

const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;
const MIN_PASSWORD_LENGTH = 6;

/**
 * POST /api/auth/register — 注册一个用户名 + 密码账户。
 * 服务端再次检查开关，避免客户端绕过隐藏的注册入口。
 */
export async function POST(req: Request) {
  if (process.env.ALLOW_REGISTRATION !== "true") {
    return NextResponse.json({ error: "当前未开放注册" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as { username?: unknown; password?: unknown };
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!USERNAME_PATTERN.test(username)) {
      return NextResponse.json(
        { error: "用户名须为 3–32 位字母、数字、下划线或连字符" },
        { status: 400 }
      );
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `密码至少 ${MIN_PASSWORD_LENGTH} 位` },
        { status: 400 }
      );
    }

    const { error } = await getSupabaseAdmin().auth.admin.createUser({
      email: usernameToEmail(username),
      password,
      // 用户名系统不收集邮箱，因此新用户直接可用，不进入邮件验证流程。
      email_confirm: true,
    });
    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        return NextResponse.json({ error: "用户名已被占用" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "注册失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
