"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser, usernameToEmail } from "@/lib/supabase-browser";
import { Button } from "./ui/Button";

interface LoginFormProps {
  registrationEnabled: boolean;
}

/** 用户名 + 密码登录/注册表单。 */
export default function LoginForm({ registrationEnabled }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

  const signIn = async () => {
    const { error: authError } = await getSupabaseBrowser().auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (authError) throw new Error("用户名或密码不对");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      if (registering) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(data.error ?? "注册失败,请重试");
      }
      await signIn();
      router.push("/capture");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : registering
            ? "注册失败,请重试"
            : "登录失败,请重试"
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setRegistering((current) => !current);
    setError("");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-thick border-black px-6 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <span className="flex min-w-0 items-center gap-2 font-mono text-label uppercase">
          <span className="h-2 w-2 shrink-0 animate-pulse bg-black" />
          AUTH: {registering ? "REGISTER" : "LOCKED"}
        </span>
        <span className="min-w-0 font-mono text-label uppercase">V0.1</span>
      </div>

      <main className="flex flex-1 flex-col justify-center px-6 pb-16">
        <h1 className="text-center font-display text-display-mobile uppercase leading-none">
          BITEWISE
        </h1>
        <p className="mt-3 text-center font-mono text-data uppercase text-ink-muted">
          拍一张,记下这一餐
        </p>

        <form
          onSubmit={submit}
          className="mt-10 border-thick border-black bg-paper p-6 shadow-hard"
        >
          <label
            htmlFor="username"
            className="block font-mono text-label uppercase text-ink-muted"
          >
            用户名
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            required
            minLength={3}
            maxLength={32}
            pattern="[A-Za-z0-9_-]{3,32}"
            title="用户名为 3–32 位字母、数字、下划线或连字符"
            className="mt-2 h-12 w-full border-thick border-black bg-paper px-4 text-body-lg outline-none focus:bg-black focus:text-paper"
          />

          <label
            htmlFor="password"
            className="mt-5 block font-mono text-label uppercase text-ink-muted"
          >
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={registering ? "new-password" : "current-password"}
            required
            minLength={6}
            className="mt-2 h-12 w-full border-thick border-black bg-paper px-4 text-body-lg outline-none focus:bg-black focus:text-paper"
          />

          {error && (
            <p className="mt-4 border-thick border-black bg-terracotta px-3 py-2 text-center font-mono text-label uppercase text-paper">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-6">
            {loading ? (registering ? "创建中…" : "验证中…") : registering ? "创建账号" : "进入系统"}
          </Button>

          {registrationEnabled && (
            <button
              type="button"
              onClick={switchMode}
              disabled={loading}
              className="mt-4 w-full font-mono text-label uppercase underline underline-offset-4 disabled:opacity-40"
            >
              {registering ? "已有账号？去登录" : "没有账号？注册"}
            </button>
          )}
        </form>
      </main>
    </div>
  );
}
