import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-session";

export const runtime = "nodejs";

const DEFAULT_DAYS = 84;
const MAX_DAYS = 366;

interface MealRow {
  created_at: string;
  food_items: { kcal_mid: number }[];
}

/** UTC 时间戳 + 浏览器 tzOffset → 本地日历日 YYYY-MM-DD */
function localDateKey(iso: string, tzOffsetMinutes: number): string {
  const localMs = new Date(iso).getTime() - tzOffsetMinutes * 60_000;
  const d = new Date(localMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * GET /api/stats/daily?days=84&tzOffsetMinutes=0
 * 近 N 天按用户本地日聚合的 kcal mid 合计;无记录的日子不返回。
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const url = new URL(req.url);
    const daysRaw = Number(url.searchParams.get("days") || DEFAULT_DAYS);
    const days = Number.isFinite(daysRaw)
      ? Math.min(MAX_DAYS, Math.max(1, Math.round(daysRaw)))
      : DEFAULT_DAYS;
    const tzRaw = Number(url.searchParams.get("tzOffsetMinutes") || 0);
    const tzOffsetMinutes = Number.isFinite(tzRaw) ? Math.round(tzRaw) : 0;

    // 多取一天缓冲,避免时区边界漏餐
    const since = new Date(
      Date.now() - (days + 1) * 24 * 60 * 60 * 1000
    ).toISOString();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("meals")
      .select("created_at, food_items(kcal_mid)")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`读取统计失败:${error.message}`);

    const totals = new Map<string, number>();
    for (const meal of (data ?? []) as MealRow[]) {
      const key = localDateKey(meal.created_at, tzOffsetMinutes);
      const mid = meal.food_items.reduce((s, i) => s + (i.kcal_mid ?? 0), 0);
      totals.set(key, (totals.get(key) ?? 0) + mid);
    }

    // 只保留窗口内的本地日(相对「今天」往前 days-1)
    const todayKey = localDateKey(new Date().toISOString(), tzOffsetMinutes);
    const todayLocal = new Date(`${todayKey}T00:00:00.000Z`).getTime();
    const windowStart = todayLocal - (days - 1) * 24 * 60 * 60 * 1000;

    const daysOut: { date: string; kcalMid: number }[] = [];
    for (const [date, kcalMid] of totals) {
      const t = new Date(`${date}T00:00:00.000Z`).getTime();
      if (t >= windowStart && t <= todayLocal) {
        daysOut.push({ date, kcalMid: Math.round(kcalMid) });
      }
    }
    daysOut.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ days: daysOut });
  } catch (e) {
    const message = e instanceof Error ? e.message : "读取统计失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
