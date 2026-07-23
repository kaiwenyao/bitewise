"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TabBar } from "@/components/TabBar";
import { PENDING_MEAL_KEY, recognizePhoto, type PendingMeal } from "@/lib/api";
import { compressPhoto } from "@/lib/image";

type Status = "idle" | "working" | "error";
/** pending=请求权限中 active=预览中 denied=被拒绝 unsupported=不支持 error=其他失败 */
type CamState = "pending" | "active" | "denied" | "unsupported" | "error";

/**
 * 拍照页:getUserMedia 实时取景 → 快门抓帧 → 压缩识别 → 结果页。
 * 相机不可用(拒绝授权/非 HTTPS/无设备)时,快门回退为系统相机文件选择器。
 */
export default function CapturePage() {
  const router = useRouter();
  const shutterInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [camState, setCamState] = useState<CamState>("pending");
  const [flash, setFlash] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // 启动实时取景;页面卸载时释放摄像头
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState("unsupported");
      return;
    }
    let cancelled = false;
    let stream: MediaStream | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        // 手电筒能力(部分 Android Chrome 支持;iOS Safari 不支持)
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as
          | { torch?: boolean }
          | undefined;
        setTorchSupported(Boolean(caps?.torch));
        setCamState("active");
      } catch (e) {
        if (cancelled) return;
        const denied =
          e instanceof DOMException &&
          (e.name === "NotAllowedError" || e.name === "SecurityError");
        setCamState(denied ? "denied" : "error");
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

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

  /** 快门:预览中抓当前帧;否则回退系统相机 */
  const handleShutter = () => {
    const video = videoRef.current;
    if (camState !== "active" || !video || !video.videoWidth) {
      shutterInput.current?.click();
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          handlePhoto(new File([blob], "capture.jpg", { type: "image/jpeg" }));
        }
      },
      "image/jpeg",
      0.92
    );
  };

  /** 闪光灯 = 摄像头手电筒,仅在设备声明支持时可用 */
  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return;
    const next = !flash;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setFlash(next);
    } catch {
      /* 设备拒绝,保持原状态 */
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

  const flashActive = flash && torchSupported;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 隐藏的文件选择器:回退路径(系统相机/图库) */}
      <input ref={shutterInput} capture="environment" {...inputProps} />
      <input ref={galleryInput} {...inputProps} />

      {/* 状态条 */}
      <div className="flex items-center justify-between border-b-[3px] border-black px-6 py-2">
        <span className="flex items-center gap-2 font-mono text-data uppercase">
          <span className="h-2 w-2 animate-pulse bg-black" />
          ANALYSIS_MODE: {status === "working" ? "RUNNING" : "ACTIVE"}
        </span>
        <span className="font-mono text-data uppercase">
          LENS_01: {camState === "active" ? "LIVE" : "OFFLINE"}
        </span>
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

      {/* 取景区:实时预览 + 扫描框 */}
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden border-b-[3px] border-black bg-black">
        {/* 实时画面 */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-fast ${
            camState === "active" ? "opacity-100" : "opacity-0"
          }`}
        />

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

        {/* 相机状态 / 识别中 / 错误提示 */}
        {camState === "pending" && (
          <div className="absolute inset-x-6 bottom-6 z-30 border-[3px] border-paper bg-black px-4 py-3 text-center font-mono text-data uppercase text-paper">
            请求相机权限中…
          </div>
        )}
        {(camState === "denied" || camState === "unsupported" || camState === "error") && (
          <div className="absolute inset-x-6 bottom-6 z-30 border-[3px] border-paper bg-black px-4 py-3 text-center font-mono text-data uppercase text-paper">
            {camState === "denied"
              ? "相机权限被拒,快门将打开系统相机"
              : camState === "unsupported"
                ? "当前浏览器不支持网页相机(需 HTTPS),快门将打开系统相机"
                : "相机启动失败,快门将打开系统相机"}
          </div>
        )}
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
            onClick={handleShutter}
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
          onClick={toggleFlash}
          disabled={!torchSupported}
          className={`group flex items-center justify-center border-l-[3px] border-black transition-colors duration-fast disabled:opacity-40 ${
            flashActive ? "bg-black" : "hover:bg-black"
          }`}
        >
          <span
            className={`flex flex-col items-center gap-2 ${
              flashActive ? "text-paper" : "group-hover:text-paper"
            }`}
          >
            <span
              className="material-symbols-outlined text-[32px]"
              style={flashActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
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
