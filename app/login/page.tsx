"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser, usernameToEmail } from "@/lib/supabase-browser";

/** 登录页:用户名 + 密码,成功后进入拍照页 */
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const { error: authError } = await getSupabaseBrowser().auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
      });
      if (authError) {
        setError("用户名或密码不对");
        setLoading(false);
        return;
      }
      router.push("/capture");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败,请重试");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 状态条 */}
      <div className="flex items-center justify-between border-b-[3px] border-black px-6 py-2">
        <span className="flex items-center gap-2 font-mono text-data uppercase">
          <span className="h-2 w-2 animate-pulse bg-black" />
          AUTH_GATE: LOCKED
        </span>
        <span className="font-mono text-data uppercase">V0.1</span>
      </div>

      <main className="flex flex-1 flex-col justify-center px-6 pb-16">
        <h1 className="text-center font-display text-display-mobile uppercase leading-none">
          BITEWISE
        </h1>
        <p className="mt-3 text-center font-mono text-data uppercase text-ink-muted">
          拍一张,记下这一餐
        </p>

        <form
          onSubmit={signIn}
          className="mt-10 border-[3px] border-black bg-paper p-6 shadow-hard"
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
            className="mt-2 h-12 w-full border-[3px] border-black bg-paper px-4 text-body-lg outline-none focus:bg-black focus:text-paper"
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
            autoComplete="current-password"
            required
            className="mt-2 h-12 w-full border-[3px] border-black bg-paper px-4 text-body-lg outline-none focus:bg-black focus:text-paper"
          />

          {error && (
            <p className="mt-4 border-[3px] border-black bg-terracotta px-3 py-2 text-center font-mono text-label uppercase text-paper">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex h-14 w-full items-center justify-center border-[3px] border-black bg-black font-mono text-data uppercase text-paper shadow-hard transition-all duration-fast hover:bg-paper hover:text-black active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-40"
          >
            {loading ? "验证中…" : "进入系统"}
          </button>
        </form>
      </main>
    </div>
  );
}
