/** 单个食物的热量估算:诚实区间,而不是伪精确值 */
export interface KcalEstimate {
  low: number;
  mid: number;
  high: number;
}

export interface FoodItem {
  id: string;
  name: string;
  /** 份量估计,单位克 */
  portionGrams: number;
  kcal: KcalEstimate;
}

/** 一条饮食记录 = 一餐 */
export interface MealRecord {
  id: string;
  /** ISO 日期,如 2026-07-22 */
  date: string;
  /** Supabase Storage 中的照片地址;未拍照的记录为 null */
  photoUrl: string | null;
  items: FoodItem[];
}

/** 历史页条目:一餐的摘要 */
export interface HistoryEntry {
  id: string;
  name: string;
  /** ISO 时间(UTC 存储);展示时由浏览器转本地 */
  createdAt: string;
  kcal: { low: number; high: number };
  /** Supabase Storage 中的照片地址;未拍照的记录为 null */
  photoUrl: string | null;
}

/** 历史页按天分组(由浏览器按本地时区分组) */
export interface HistoryDay {
  /** 分组标题,如 07.23 THU */
  label: string;
  entries: HistoryEntry[];
}
