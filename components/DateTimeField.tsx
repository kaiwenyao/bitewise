"use client";

import { CalendarIcon } from "./icons";

interface DateTimeFieldProps {
  /** "YYYY-MM-DDTHH:mm" 本地时间 */
  value: string;
  onChange: (next: string) => void;
  /** 日期上限(YYYY-MM-DD) */
  maxDate?: string;
  ariaLabel?: string;
}

/** YYYY-MM-DD → DD / MM / YYYY；空值占位 */
function formatDateDisplay(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return "-- / -- / ----";
  return `${m[3]} / ${m[2]} / ${m[1]}`;
}

/** HH:mm → HH : MM；空值占位 */
function formatTimeDisplay(time: string): string {
  const m = /^(\d{2}):(\d{2})/.exec(time);
  if (!m) return "-- : --";
  return `${m[1]} : ${m[2]}`;
}

const shellCls =
  "relative flex h-12 w-full items-center justify-between border-thick border-black bg-paper px-3 focus-within:bg-black focus-within:text-paper";

/**
 * 日期 + 时间选择器。
 * 可见层自绘等宽文案(两端一致);透明原生 input 铺满接收点击,
 * 避免 iOS Safari 用系统本地化格式重绘控件外观。
 */
export function DateTimeField({
  value,
  onChange,
  maxDate,
  ariaLabel,
}: DateTimeFieldProps) {
  const [date = "", time = ""] = value.split("T");

  return (
    <div className="mt-2 grid grid-cols-1 gap-3">
      <div className={shellCls}>
        <span className="pointer-events-none font-mono text-data uppercase tracking-wide">
          {formatDateDisplay(date)}
        </span>
        <CalendarIcon
          className="pointer-events-none shrink-0"
          width={20}
          height={20}
        />
        <input
          type="date"
          aria-label={ariaLabel ? `${ariaLabel}日期` : "日期"}
          value={date}
          max={maxDate}
          onChange={(e) => onChange(`${e.target.value}T${time || "00:00"}`)}
          className="datetime-overlay-input"
        />
      </div>

      <div className={shellCls}>
        <span className="pointer-events-none font-mono text-data uppercase tracking-wide">
          {formatTimeDisplay(time)}
        </span>
        <span
          className="material-symbols-outlined pointer-events-none text-[20px] leading-none"
          aria-hidden
        >
          schedule
        </span>
        <input
          type="time"
          aria-label={ariaLabel ? `${ariaLabel}时间` : "时间"}
          value={time}
          onChange={(e) => onChange(`${date}T${e.target.value}`)}
          className="datetime-overlay-input"
        />
      </div>
    </div>
  );
}
