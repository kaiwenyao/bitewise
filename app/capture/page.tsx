"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TabBar } from "@/components/TabBar";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/ui/Button";
import {
  PENDING_MEAL_KEY,
  recognizeMeal,
  type AiProvider,
  type PendingMeal,
} from "@/lib/api";
import { compressPhoto } from "@/lib/image";

type Status = "idle" | "working" | "error";
/** pending=请求权限中 active=预览中 denied=被拒绝 unsupported=不支持 error=其他失败 */
type CamState = "pending" | "active" | "denied" | "unsupported" | "error";

const PROVIDER_KEY = "bitewise:aiProvider";
const MAX_NOTE_LEN = 200;

function readStoredProvider(): AiProvider {
  if (typeof window === "undefined") return "minimax";
  try {
    return localStorage.getItem(PROVIDER_KEY) === "openai" ? "openai" : "minimax";
  } catch {
    return "minimax";
  }
}

/**
 * 拍照页:getUserMedia 实时取景 → 快门抓帧 → 压缩识别 → 结果页。
 * 可附补充说明;也可纯文字记餐。相机不可用时快门回退系统相机。
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
  const [provider, setProvider] = useState<AiProvider>("minimax");
  /** 拍照时附带的可选补充说明 */
  const [caption, setCaption] = useState("");
  const [textSheetOpen, setTextSheetOpen] = useState(false);
  const [textNote, setTextNote] = useState("");

  useEffect(() => {
    setProvider(readStoredProvider());
  }, []);

  const selectProvider = (next: AiProvider) => {
    setProvider(next);
    try {
      localStorage.setItem(PROVIDER_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  };

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

  const stashAndGo = (pending: PendingMeal) => {
    sessionStorage.setItem(PENDING_MEAL_KEY, JSON.stringify(pending));
    router.push("/result");
  };

  const handlePhoto = async (file: File | undefined) => {
    if (!file || status === "working") return;
    setStatus("working");
    setError("");
    try {
      const photo = await compressPhoto(file);
      const note = caption.trim().slice(0, MAX_NOTE_LEN);
      const result = await recognizeMeal({
        image: photo,
        note: note || undefined,
        provider,
      });
      stashAndGo({
        photoBase64: photo.base64,
        mimeType: photo.mimeType,
        note: note || undefined,
        items: result.items,
        provider,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "识别失败,请重试");
      setStatus("error");
    }
  };

  const handleTextRecognize = async (close: () => void) => {
    const note = textNote.trim().slice(0, MAX_NOTE_LEN);
    if (!note || status === "working") return;
    setStatus("working");
    setError("");
    try {
      const result = await recognizeMeal({ note, provider });
      close();
      stashAndGo({
        photoBase64: null,
        mimeType: "image/jpeg",
        note,
        items: result.items,
        provider,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "识别失败,请重试");
      setStatus("error");
    }
  };

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
      e.target.value = "";
    },
  } as const;

  const flashActive = flash && torchSupported;
  const textReady = textNote.trim().length > 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <input ref={shutterInput} capture="environment" {...inputProps} />
      <input ref={galleryInput} {...inputProps} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b-thick border-black px-6 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <span className="flex min-w-0 items-center gap-2 font-mono text-label uppercase">
          <span className="h-2 w-2 shrink-0 animate-pulse bg-black" />
          MODE: {status === "working" ? "RUNNING" : "ACTIVE"}
        </span>
        <div
          className="flex shrink-0 border-[2px] border-black"
          role="group"
          aria-label="识别引擎"
        >
          {(["minimax", "openai"] as const).map((p) => (
            <button
              key={p}
              type="button"
              disabled={status === "working"}
              onClick={() => selectProvider(p)}
              className={`px-2 py-0.5 font-mono text-label uppercase transition-colors duration-fast disabled:opacity-40 ${
                provider === p
                  ? "bg-black text-paper"
                  : "bg-paper text-ink hover:bg-black hover:text-paper"
              }`}
            >
              {p === "minimax" ? "MiniMax" : "OpenAI"}
            </button>
          ))}
        </div>
      </div>

      <header className="flex items-center justify-between border-b-thick border-black px-6 py-4">
        <span
          className="material-symbols-outlined text-[28px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          fingerprint
        </span>
        <h1 className="font-display text-headline-lg uppercase">BITEWISE</h1>
        <div className="border-thick border-black px-3 py-1 font-mono text-data">
          ID-8822
        </div>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden border-b-thick border-black bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-fast ${
            camState === "active" ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* 手电筒:移到取景区角落,设备支持时才显示 */}
        {torchSupported && (
          <button
            type="button"
            onClick={toggleFlash}
            aria-label="闪光灯"
            className={`absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center border-thick border-paper transition-colors duration-fast ${
              flashActive ? "bg-paper text-black" : "bg-black text-paper hover:bg-paper hover:text-black"
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={flashActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              bolt
            </span>
          </button>
        )}

        <div className="relative z-10 flex h-64 w-64 flex-col justify-between sm:h-80 sm:w-80">
          <div className="flex w-full justify-between">
            <div className="h-8 w-8 border-l-[5px] border-t-[5px] border-paper" />
            <div className="h-8 w-8 border-r-[5px] border-t-[5px] border-paper" />
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-50">
            <div className="h-[2px] w-full bg-paper" />
            <div className="absolute h-full w-[2px] bg-paper" />
          </div>
          <div className="flex w-full justify-between">
            <div className="h-8 w-8 border-b-[5px] border-l-[5px] border-paper" />
            <div className="h-8 w-8 border-b-[5px] border-r-[5px] border-paper" />
          </div>
        </div>
        <div className="pointer-events-none absolute left-0 top-0 z-20 h-2 w-full animate-[scan_3s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-paper/50 to-transparent" />

        {camState === "pending" && (
          <div className="absolute inset-x-6 bottom-6 z-30 border-thick border-paper bg-black px-4 py-3 text-center font-mono text-data uppercase text-paper">
            请求相机权限中…
          </div>
        )}
        {(camState === "denied" ||
          camState === "unsupported" ||
          camState === "error") && (
          <div className="absolute inset-x-6 bottom-6 z-30 border-thick border-paper bg-black px-4 py-3 text-center font-mono text-data uppercase text-paper">
            {camState === "denied"
              ? "相机权限被拒,快门将打开系统相机"
              : camState === "unsupported"
                ? "当前浏览器不支持网页相机(需 HTTPS),快门将打开系统相机"
                : "相机启动失败,快门将打开系统相机"}
          </div>
        )}
        {status === "working" && (
          <div className="absolute inset-x-6 bottom-6 z-30 border-thick border-paper bg-black px-4 py-3 text-center font-mono text-data uppercase text-paper">
            识别中,通常几秒…
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-x-6 bottom-6 z-30 border-thick border-paper bg-terracotta px-4 py-3 text-center font-mono text-data uppercase text-paper">
            {error}
          </div>
        )}
      </main>

      {/* 拍照时可选补充说明 */}
      <div className="border-b-thick border-black bg-paper px-4 py-2">
        <label htmlFor="photo-caption" className="sr-only">
          补充说明
        </label>
        <input
          id="photo-caption"
          type="text"
          maxLength={MAX_NOTE_LEN}
          value={caption}
          disabled={status === "working"}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="补充说明（可选），如：少油 / 半份"
          className="h-11 w-full border-thick border-black bg-paper px-3 font-mono text-data outline-none placeholder:text-ink-faint focus:bg-black focus:text-paper disabled:opacity-40"
        />
      </div>

      <div className="grid h-32 w-full shrink-0 grid-cols-3 border-b-thick border-black bg-paper">
        <button
          type="button"
          onClick={() => galleryInput.current?.click()}
          disabled={status === "working"}
          className="group flex items-center justify-center border-r-thick border-black transition-colors duration-fast hover:bg-black disabled:opacity-40"
        >
          <span className="flex flex-col items-center gap-2 group-hover:text-paper">
            <span className="material-symbols-outlined text-[32px]">image</span>
            <span className="font-mono text-data uppercase">相册</span>
          </span>
        </button>
        <div className="flex items-center justify-center p-4">
          <button
            type="button"
            onClick={handleShutter}
            disabled={status === "working"}
            aria-label="拍照"
            className="group relative flex h-20 w-20 items-center justify-center border-thick border-black bg-black shadow-hard transition-all duration-fast hover:scale-95 hover:bg-paper active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-40"
          >
            <span
              className={`h-10 w-10 border-thick border-paper transition-colors duration-fast group-hover:border-black group-hover:bg-black ${
                status === "working" ? "animate-pulse" : ""
              }`}
            />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setTextSheetOpen(true)}
          disabled={status === "working"}
          className="group flex items-center justify-center border-l-thick border-black transition-colors duration-fast hover:bg-black disabled:opacity-40"
        >
          <span className="flex flex-col items-center gap-2 group-hover:text-paper">
            <span className="material-symbols-outlined text-[32px]">edit_note</span>
            <span className="font-mono text-data uppercase">文字</span>
          </span>
        </button>
      </div>

      <TabBar />

      {textSheetOpen && (
        <BottomSheet
          onClose={() => setTextSheetOpen(false)}
          ariaLabel="文字记餐"
        >
          {(close) => (
            <>
              <p className="mb-5 font-mono text-label uppercase text-ink-muted">
                TEXT_ENTRY // 写这餐吃了什么
              </p>
              <label
                className="block font-mono text-label uppercase text-ink-muted"
                htmlFor="text-meal-note"
              >
                描述
              </label>
              <textarea
                id="text-meal-note"
                rows={3}
                maxLength={MAX_NOTE_LEN}
                value={textNote}
                disabled={status === "working"}
                onChange={(e) => setTextNote(e.target.value)}
                placeholder="一杯美式咖啡 / 一根香蕉"
                className="mt-2 w-full resize-none border-thick border-black bg-paper px-4 py-3 font-mono text-data outline-none placeholder:text-ink-faint focus:bg-black focus:text-paper disabled:opacity-40"
              />
              <p className="mt-2 font-mono text-label uppercase text-ink-faint">
                {textNote.trim().length}/{MAX_NOTE_LEN}
              </p>
              {status === "error" && error && (
                <p className="mt-3 border-thick border-black bg-terracotta px-4 py-3 text-center font-mono text-data uppercase text-paper">
                  {error}
                </p>
              )}
              <div className="mt-6">
                <Button
                  onClick={() => handleTextRecognize(close)}
                  disabled={!textReady || status === "working"}
                >
                  {status === "working" ? "识别中…" : "识别"}
                </Button>
              </div>
            </>
          )}
        </BottomSheet>
      )}
    </div>
  );
}
