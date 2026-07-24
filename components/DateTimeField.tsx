"use client";

interface DateTimeFieldProps {
  /** "YYYY-MM-DDTHH:mm" 本地时间 */
  value: string;
  onChange: (next: string) => void;
  /** 日期上限(YYYY-MM-DD) */
  maxDate?: string;
  ariaLabel?: string;
}

const inputCls =
  "block h-12 w-full min-w-0 max-w-full border-[3px] border-black bg-paper px-3 font-mono text-data outline-none focus:bg-black focus:text-paper";

/**
 * 日期 + 时间两个原生选择器。
 * iOS 单个 datetime-local 是原生复合控件,固有宽度不可控、会溢出屏幕;
 * 拆开后每个控件都很窄,且分别调起系统的日期/时间滚轮。
 */
export function DateTimeField({
  value,
  onChange,
  maxDate,
  ariaLabel,
}: DateTimeFieldProps) {
  const [date = "", time = ""] = value.split("T");
  return (
    <div className="grid grid-cols-2 gap-3">
      <input
        type="date"
        aria-label={ariaLabel ? `${ariaLabel}日期` : "日期"}
        value={date}
        max={maxDate}
        onChange={(e) => onChange(`${e.target.value}T${time || "00:00"}`)}
        className={inputCls}
      />
      <input
        type="time"
        aria-label={ariaLabel ? `${ariaLabel}时间` : "时间"}
        value={time}
        onChange={(e) => onChange(`${date}T${e.target.value}`)}
        className={inputCls}
      />
    </div>
  );
}
