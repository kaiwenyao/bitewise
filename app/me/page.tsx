import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";

const configActions = [
  { no: "01", label: "健康数据同步", icon: "arrow_forward" },
  { no: "02", label: "隐私协议", icon: "arrow_forward" },
  { no: "03", label: "退出登录", icon: "logout", destructive: true },
] as const;

/** 个人页:用户数据、每日目标与系统设置 */
export default function MePage() {
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

        {/* 用户信息 + 每日目标 */}
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
              ID ALLOCATION
            </p>
            <h3 className="font-display text-headline-lg uppercase leading-none">
              ID-8822
            </h3>
            <div className="my-4 h-[3px] w-full bg-black" />
            <p className="mb-1 font-mono text-data uppercase text-ink-faint">
              SYSTEM ENTRY
            </p>
            <p className="font-display text-headline-md uppercase leading-none">
              2026.07
            </p>
          </section>

          <section className="group p-6">
            <div className="mb-6 flex w-full items-center justify-between">
              <span className="bg-terracotta px-2 py-1 font-mono text-label uppercase tracking-widest text-paper">
                METRICS_TARGET
              </span>
              <span className="material-symbols-outlined text-4xl text-terracotta transition-transform duration-300 group-hover:scale-110">
                target
              </span>
            </div>
            <p className="mb-1 font-mono text-data uppercase text-ink-faint">
              每日摄入目标
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="font-display text-display-mobile uppercase leading-none">
                1800
              </h3>
              <span className="font-display text-headline-md uppercase text-ink-faint">
                - 2200
              </span>
            </div>
            <p className="mt-1 font-display text-headline-md uppercase">KCAL</p>
            {/* 进度条:目标区间占比,mock 阶段固定 2/3 */}
            <div className="mt-4 flex h-8 w-full overflow-hidden border-[3px] border-black">
              <div className="h-full w-2/3 border-r-[3px] border-black bg-black" />
              <div className="h-full w-1/3" />
            </div>
            <p className="mt-2 w-full text-right font-mono text-data uppercase">
              OPTIMAL RANGE
            </p>
          </section>
        </div>

        {/* 系统设置 */}
        <section className="border-[3px] border-t-0 border-black">
          <div className="border-b-[3px] border-black bg-black p-4 text-paper">
            <h3 className="font-display text-headline-md uppercase">
              SYSTEM CONFIG
            </h3>
          </div>
          {configActions.map((action, index) => (
            <button
              key={action.no}
              className={`group flex w-full items-center justify-between p-6 text-left transition-colors duration-fast ${
                index < configActions.length - 1
                  ? "border-b-[3px] border-black"
                  : ""
              } ${
                "destructive" in action && action.destructive
                  ? "hover:bg-terracotta hover:text-paper"
                  : "hover:bg-black hover:text-paper"
              }`}
            >
              <span className="flex items-center gap-4">
                <span className="font-mono text-data opacity-50 transition-opacity group-hover:opacity-100">
                  {action.no}
                </span>
                <span className="font-display text-headline-md uppercase">
                  {action.label}
                </span>
              </span>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-2">
                {action.icon}
              </span>
            </button>
          ))}
        </section>
      </main>

      <TabBar />
    </div>
  );
}
