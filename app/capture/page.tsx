"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TabBar } from "@/components/TabBar";
import { PENDING_MEAL_KEY, recognizePhoto, type PendingMeal } from "@/lib/api";
import { compressPhoto } from "@/lib/image";

type Status = "idle" | "working" | "error";

/** 拍照页:调起相机/相册 → 上传并识别 → 跳转结果页 */
export default function CapturePage() {
  const router = useRouter();
  const shutterInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(false);

  const handlePhoto = async (file: File | undefined) => {
    if (!file || status === "working") return;
    setStatus("working");
    setError("");
    try {
      // 客户端压缩后再识别;原图不出浏览器,保存时才上传
      const photo = await compressPhoto(file);
      const result = await recognizePhoto(photo);
      const pending: PendingMeal = {
        photoBase64: photo.base64,
        mimeType: photo.mimeType,
        items: result.items,
      };
      sessionStorage.setItem(PENDING_MEAL_KEY, JSON.stringify(pending));
      router.push("/result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "识别失败,请重试");
      setStatus("error");
    }
  };

  const inputProps = {
    type: "file",
    accept: "image/*",
    className: "hidden",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      handlePhoto(e.target.files?.[0]);
      e.target.value = ""; // 允许重选同一张
    },
  } as const;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 隐藏的文件选择器:快门强制调起相机,相册走图库 */}
      <input ref={shutterInput} capture="environment" {...inputProps} />
      <input ref={galleryInput} {...inputProps} />

      {/* 状态条 */}
      <div className="flex items-center justify-between border-b-[3px] border-black px-6 py-2">
        <span className="flex items-center gap-2 font-mono text-data uppercase">
          <span className="h-2 w-2 animate-pulse bg-black" />
          ANALYSIS_MODE: {status === "working" ? "RUNNING" : "ACTIVE"}
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

      {/* 取景区 */}
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

        {/* 识别中 / 错误提示 */}
        {status === "working" && (
          <div className="absolute inset-x-6 bottom-6 z-30 border-[3px] border-paper bg-black px-4 py-3 text-center font-mono text-data uppercase text-paper">
            上传并识别中,通常几秒…
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-x-6 bottom-6 z-30 border-[3px] border-paper bg-terracotta px-4 py-3 text-center font-mono text-data uppercase text-paper">
            {error}
          </div>
        )}
      </main>

      {/* 拍摄控制条 */}
      <div className="grid h-32 w-full shrink-0 grid-cols-3 border-b-[3px] border-black bg-paper">
        <button
          onClick={() => galleryInput.current?.click()}
          disabled={status === "working"}
          className="group flex items-center justify-center border-r-[3px] border-black transition-colors duration-fast hover:bg-black disabled:opacity-40"
        >
          <span className="flex flex-col items-center gap-2 group-hover:text-paper">
            <span className="material-symbols-outlined text-[32px]">image</span>
            <span className="font-mono text-data uppercase">相册</span>
          </span>
        </button>
        <div className="flex items-center justify-center p-4">
          <button
            onClick={() => shutterInput.current?.click()}
            disabled={status === "working"}
            aria-label="拍照"
            className="group relative flex h-20 w-20 items-center justify-center border-[3px] border-black bg-black shadow-hard transition-all duration-fast hover:scale-95 hover:bg-paper active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-40"
          >
            <span
              className={`h-10 w-10 border-[3px] border-paper transition-colors duration-fast group-hover:border-black group-hover:bg-black ${
                status === "working" ? "animate-pulse" : ""
              }`}
            />
          </button>
        </div>
        <button
          onClick={() => setFlash((f) => !f)}
          className={`group flex items-center justify-center border-l-[3px] border-black transition-colors duration-fast hover:bg-black ${
            flash ? "bg-black text-paper" : ""
          }`}
        >
          <span
            className={`flex flex-col items-center gap-2 group-hover:text-paper ${
              flash ? "text-paper" : ""
            }`}
          >
            <span
              className="material-symbols-outlined text-[32px]"
              style={flash ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              bolt
            </span>
            <span className="font-mono text-data uppercase">闪光灯</span>
          </span>
        </button>
      </div>

      <TabBar />
    </div>
  );
}
