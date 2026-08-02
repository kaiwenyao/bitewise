import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { SignOutButton } from "@/components/SignOutButton";
import { MeMetrics } from "@/components/MeMetrics";
import { getSessionUser } from "@/lib/supabase-session";
import { emailToUsername } from "@/lib/supabase-browser";

// 依赖登录会话,必须按请求渲染(否则构建期会把占位符静态化)
export const dynamic = "force-dynamic";

/** 个人页:真实用户数据、每日目标、热量热力图与系统设置 */
export default async function MePage() {
  // 未配置 Supabase(纯前端开发)时显示占位
  let username = "—";
  let entry = "—";
  try {
    const user = await getSessionUser();
    if (user?.email) {
      username = emailToUsername(user.email).toUpperCase();
      const at = new Date(user.created_at);
      entry = `${at.getFullYear()}.${String(at.getMonth() + 1).padStart(2, "0")}`;
    }
  } catch {
    /* env 未配置,保持占位 */
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />

      <main className="flex-1 pb-8">
        {/* 页头 */}
        <div className="bg-black p-6 text-center text-paper">
          <h1 className="font-display text-display-mobile uppercase leading-none">
            PROFILE
          </h1>
        </div>

        {/* 用户信息 + 每日目标 + 热力图 */}
        <div className="grid grid-cols-1 border-x-[3px] border-b-[3px] border-black">
          <section className="group border-b-[3px] border-black p-6">
            <div className="mb-6 flex w-full items-center justify-between">
              <span className="bg-black px-2 py-1 font-mono text-label uppercase tracking-widest text-paper">
                USER_DATA
              </span>
              <span className="material-symbols-outlined text-4xl transition-transform duration-300 group-hover:rotate-12">
                fingerprint
              </span>
            </div>
            <p className="mb-1 font-mono text-data uppercase text-ink-faint">
              用户名
            </p>
            <h3 className="break-all font-display text-headline-lg uppercase leading-none">
              {username}
            </h3>
            <div className="my-4 h-[3px] w-full bg-black" />
            <p className="mb-1 font-mono text-data uppercase text-ink-faint">
              SYSTEM ENTRY
            </p>
            <p className="font-display text-headline-md uppercase leading-none">
              {entry}
            </p>
          </section>

          <MeMetrics />
        </div>

        {/* 系统设置 */}
        <section className="border-[3px] border-t-0 border-black">
          <div className="border-b-[3px] border-black bg-black p-4 text-paper">
            <h3 className="font-display text-headline-md uppercase">
              SYSTEM CONFIG
            </h3>
          </div>
          <ChangePasswordForm />
          <SignOutButton />
        </section>
      </main>

      <TabBar />
    </div>
  );
}
