"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "./ui/Button";

const MIN_PASSWORD_LENGTH = 6;

/** 个人页改密码:可折叠表单,先校验当前密码再 updateUser。 */
export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resetFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const toggle = () => {
    if (loading) return;
    // 展开/收起都清空密码字段,避免残留;同时清掉成功提示避免再次展开时误显
    resetFields();
    setSuccess(false);
    setOpen((wasOpen) => !wasOpen);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`新密码至少 ${MIN_PASSWORD_LENGTH} 位`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }
    if (newPassword === currentPassword) {
      setError("新密码不能与当前密码相同");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const supabase = getSupabaseBrowser();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user?.email) throw new Error("未登录或会话已失效");

      // Supabase Auth 无 reauthenticate API;用同账号 signInWithPassword 校验旧密码。
      // 会换发新 session(SIGNED_IN)。本项目无 onAuthStateChange 监听,可接受。
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (authError) throw new Error("当前密码不对");

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw new Error("修改失败,请重试");

      if (!mountedRef.current) return;
      resetFields();
      setOpen(false);
      setSuccess(true);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "修改失败,请重试");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <div className="border-b-thick border-black">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-expanded={open}
        className="group flex w-full items-center justify-between p-6 text-left transition-colors duration-fast hover:bg-black hover:text-paper disabled:opacity-40"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-4">
            <span className="font-mono text-data opacity-50 transition-opacity group-hover:opacity-100">
              KEY
            </span>
            <span className="font-display text-headline-md uppercase">
              修改密码
            </span>
          </span>
          {success && !open && (
            <span
              role="status"
              aria-live="polite"
              className="font-mono text-label uppercase text-ink-muted"
            >
              密码已更新
            </span>
          )}
        </span>
        <span
          className={`material-symbols-outlined shrink-0 transition-transform duration-fast ${
            open ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <form onSubmit={submit} className="border-t-thick border-black px-6 pb-6">
          <label
            htmlFor="current-password"
            className="mt-5 block font-mono text-label uppercase text-ink-muted"
          >
            当前密码
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-2 h-12 w-full border-thick border-black bg-paper px-4 text-body-lg outline-none focus:bg-black focus:text-paper"
          />

          <label
            htmlFor="new-password"
            className="mt-5 block font-mono text-label uppercase text-ink-muted"
          >
            新密码
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            className="mt-2 h-12 w-full border-thick border-black bg-paper px-4 text-body-lg outline-none focus:bg-black focus:text-paper"
          />

          <label
            htmlFor="confirm-password"
            className="mt-5 block font-mono text-label uppercase text-ink-muted"
          >
            确认新密码
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            className="mt-2 h-12 w-full border-thick border-black bg-paper px-4 text-body-lg outline-none focus:bg-black focus:text-paper"
          />

          {error && (
            <p
              role="alert"
              className="mt-4 border-thick border-black bg-terracotta px-3 py-2 text-center font-mono text-label uppercase text-paper"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-6">
            {loading ? "修改中…" : "确认修改"}
          </Button>
        </form>
      )}
    </div>
  );
}
