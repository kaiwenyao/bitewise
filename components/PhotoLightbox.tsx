"use client";

import { useEffect } from "react";

interface PhotoLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

/** 全屏大图预览:点背景 / Esc / 关闭按钮退出 */
export function PhotoLightbox({
  src,
  alt = "这一餐的照片",
  onClose,
}: PhotoLightboxProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black animate-[fade-in_200ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-label="查看大图"
    >
      <button
        type="button"
        aria-label="关闭"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="关闭大图"
        className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center border-[3px] border-paper bg-black text-paper transition-colors duration-fast hover:bg-paper hover:text-black"
      >
        <span className="material-symbols-outlined text-[22px]">close</span>
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 max-h-[min(100dvh,100%)] max-w-[min(100vw,100%)] object-contain p-4 sm:p-8"
      />
    </div>
  );
}
