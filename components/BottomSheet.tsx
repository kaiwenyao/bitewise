"use client";

import { useEffect, useState, type ReactNode } from "react";

interface BottomSheetProps {
  onClose: () => void;
  ariaLabel: string;
  /** 内部动作(如保存)通过 close 触发退出动画后再卸载 */
  children: (close: () => void) => ReactNode;
}

/** 底部抽屉骨架:背层 + Esc 关闭 + 滑入滑出动画 */
export function BottomSheet({ onClose, ariaLabel, children }: BottomSheetProps) {
  const [closing, setClosing] = useState(false);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 220);
  };

  // Esc 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {/* 背层 */}
      <button
        aria-label="关闭"
        onClick={close}
        className={`absolute inset-0 bg-black/60 ${
          closing ? "" : "animate-[fade-in_200ms_ease-out]"
        }`}
        style={closing ? { opacity: 0, transition: "opacity 200ms" } : undefined}
      />
      {/* 抽屉 */}
      <div
        className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] border-t-[3px] border-black bg-paper px-6 pb-8 pt-6 ${
          closing
            ? "animate-[sheet-out_220ms_ease-in_forwards]"
            : "animate-[sheet-in_250ms_ease-out]"
        }`}
      >
        {children(close)}
      </div>
    </div>
  );
}
