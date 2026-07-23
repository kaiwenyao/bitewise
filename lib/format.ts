import type { FoodItem } from "./types";

export interface KcalTotal {
  low: number;
  mid: number;
  high: number;
}

/** 所有热量统一取整 */
export const roundKcal = (n: number): number => Math.round(n);

/** Date → <input type="datetime-local"> 的本地时间格式(YYYY-MM-DDTHH:mm) */
export function toDateTimeInputValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

/** 历史页分组标题,如 07.23 THU(调用方时区) */
export function dayLabel(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}.${p(d.getDate())} ${WEEKDAYS[d.getDay()]}`;
}

/** 历史页条目时间,如 08:30(调用方时区) */
export function timeLabel(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function sumMeal(items: FoodItem[]): KcalTotal {
  return items.reduce<KcalTotal>(
    (acc, item) => ({
      low: acc.low + item.kcal.low,
      mid: acc.mid + item.kcal.mid,
      high: acc.high + item.kcal.high,
    }),
    { low: 0, mid: 0, high: 0 }
  );
}
