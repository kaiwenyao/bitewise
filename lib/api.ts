import type { FoodItem, HistoryDay } from "./types";

/**
 * 浏览器端数据访问层 —— 全部经由 Next.js Route Handler,
 * Supabase sb_secret 与 MiniMax 密钥只存在于服务端。
 */

export interface RecognizeResult {
  items: Omit<FoodItem, "id">[];
}

/** 拍照页识别完后存进 sessionStorage、结果页取出的结构 */
export interface PendingMeal extends RecognizeResult {
  photoBase64: string;
  mimeType: string;
}

/** sessionStorage 钥匙:拍照页识别完,结果页取出 */
export const PENDING_MEAL_KEY = "bitewise:pendingMeal";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `请求失败(${res.status})`);
  }
  return data as T;
}

/** 压缩后的照片送去识别(只识别,不落盘) */
export function recognizePhoto(photo: {
  base64: string;
  mimeType: string;
}): Promise<RecognizeResult> {
  return request<RecognizeResult>("/api/recognize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: photo.base64, mimeType: photo.mimeType }),
  });
}

/** 保存一餐到数据库(照片同时上传 Storage) */
export async function saveMeal(meal: {
  photoBase64: string | null;
  mimeType: string;
  items: FoodItem[];
}): Promise<void> {
  await request<{ id: string }>("/api/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      photoBase64: meal.photoBase64,
      mimeType: meal.mimeType,
      items: meal.items,
    }),
  });
}

/** 分页拉取历史记录 */
export function fetchHistory(
  offset: number
): Promise<{ days: HistoryDay[]; hasMore: boolean }> {
  return request(`/api/history?offset=${offset}`);
}
