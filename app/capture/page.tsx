import Link from "next/link";
import { TabBar } from "@/components/TabBar";

/** 拍照页:取景框 + 拍摄控制,快门进入识别结果 */
export default function CapturePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* 状态条 */}
      <div className="flex items-center justify-between border-b-[3px] border-black px-6 py-2">
        <span className="flex items-center gap-2 font-mono text-data uppercase">
          <span className="h-2 w-2 animate-pulse bg-black" />
          ANALYSIS_MODE: ACTIVE
        </span>
        <span className="font-mono text-data uppercase">LENS_01</span>
      </div>

      {/* 顶栏 */}
      <header className="flex items-center justify-between border-b-[3px] border-black px-6 py-4">
        <span
          className="material-symbols-outlined text-[28px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          fingerprint
        </span>
        <h1 className="font-display text-headline-lg uppercase">BITEWISE</h1>
        <div className="border-[3px] border-black px-3 py-1 font-mono text-data">
          ID-8822
        </div>
      </header>

      {/* 取景区:接入相机后替换为实时预览 */}
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden border-b-[3px] border-black bg-black">
        {/* 扫描框 */}
        <div className="relative z-10 flex h-64 w-64 flex-col justify-between sm:h-80 sm:w-80">
          <div className="flex w-full justify-between">
            <div className="h-8 w-8 border-l-[5px] border-t-[5px] border-paper" />
            <div className="h-8 w-8 border-r-[5px] border-t-[5px] border-paper" />
          </div>
          {/* 十字线 */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-50">
            <div className="h-[2px] w-full bg-paper" />
            <div className="absolute h-full w-[2px] bg-paper" />
          </div>
          <div className="flex w-full justify-between">
            <div className="h-8 w-8 border-b-[5px] border-l-[5px] border-paper" />
            <div className="h-8 w-8 border-b-[5px] border-r-[5px] border-paper" />
          </div>
        </div>
        {/* 扫描线动画 */}
        <div className="pointer-events-none absolute left-0 top-0 z-20 h-2 w-full animate-[scan_3s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-paper/50 to-transparent" />
      </main>

      {/* 拍摄控制条 */}
      <div className="grid h-32 w-full shrink-0 grid-cols-3 border-b-[3px] border-black bg-paper">
        <button className="group flex items-center justify-center border-r-[3px] border-black transition-colors duration-fast hover:bg-black">
          <span className="flex flex-col items-center gap-2 group-hover:text-paper">
            <span className="material-symbols-outlined text-[32px]">image</span>
            <span className="font-mono text-data uppercase">相册</span>
          </span>
        </button>
        <div className="flex items-center justify-center p-4">
          <Link
            href="/result"
            aria-label="拍照"
            className="group relative flex h-20 w-20 items-center justify-center border-[3px] border-black bg-black shadow-hard transition-all duration-fast hover:scale-95 hover:bg-paper active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          >
            <span className="h-10 w-10 border-[3px] border-paper transition-colors duration-fast group-hover:border-black group-hover:bg-black" />
          </Link>
        </div>
        <button className="group flex items-center justify-center border-l-[3px] border-black transition-colors duration-fast hover:bg-black">
          <span className="flex flex-col items-center gap-2 group-hover:text-paper">
            <span className="material-symbols-outlined text-[32px]">bolt</span>
            <span className="font-mono text-data uppercase">闪光灯</span>
          </span>
        </button>
      </div>

      <TabBar />
    </div>
  );
}
