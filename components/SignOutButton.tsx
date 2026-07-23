"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/** 退出登录:清除会话,回到登录页 */
export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await getSupabaseBrowser().auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={signOut}
      disabled={loading}
      className="group flex w-full items-center justify-between p-6 text-left transition-colors duration-fast hover:bg-terracotta hover:text-paper disabled:opacity-40"
    >
      <span className="flex items-center gap-4">
        <span className="font-mono text-data opacity-50 transition-opacity group-hover:opacity-100">
          01
        </span>
        <span className="font-display text-headline-md uppercase">
          {loading ? "退出中…" : "退出登录"}
        </span>
      </span>
      <span className="material-symbols-outlined transition-transform group-hover:translate-x-2">
        logout
      </span>
    </button>
  );
}
