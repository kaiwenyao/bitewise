import type { FoodItem } from "./types";

export interface KcalTotal {
  low: number;
  mid: number;
  high: number;
}

/** 所有热量统一取整 */
export const roundKcal = (n: number): number => Math.round(n);

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
