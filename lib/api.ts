import type { MealRecord } from "./types";
import { mockMeal } from "./mock";

/**
 * 数据访问层 —— 当前全部为 mock。
 *
 * TODO(Supabase) 接入真实后端时:
 * - recognizeMeal: 照片上传 Supabase Storage → 触发 Edge Function 调 AI 识别
 * - saveMeal:      insert 到 `meals` / `meal_items` 表
 * - 安全:RLS 策略基于 auth.uid()(真实 JWT 身份)判断数据归属,
 *   绝不信任客户端传入的 user_id。
 */

/** 模拟 AI 识别耗时,返回识别结果 */
export async function recognizeMeal(): Promise<MealRecord> {
  await new Promise((resolve) => setTimeout(resolve, 1400));
  return structuredClone(mockMeal);
}

/** 保存到今天的饮食记录 */
export async function saveMeal(meal: MealRecord): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log("[mock] 已保存记录", meal);
}
