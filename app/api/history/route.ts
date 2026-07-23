import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-session";
import type { HistoryDay, HistoryEntry } from "@/lib/types";

export const runtime = "nodejs";

const PAGE_SIZE = 20;
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

interface MealRow {
  id: string;
  created_at: string;
  photo_url: string | null;
  food_items: {
    name: string;
    kcal_low: number;
    kcal_high: number;
    position: number;
  }[];
}

/** GET /api/history?offset=0 — 按天分组的历史记录 */
export async function GET(req: Request) {
  try {
    const offset = Math.max(0, Number(new URL(req.url).searchParams.get("offset")) || 0);

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("meals")
      .select("id, created_at, photo_url, food_items(name, kcal_low, kcal_high, position)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE); // 多取一条判断 hasMore
    if (error) throw new Error(`读取历史失败:${error.message}`);

    const rows = (data ?? []) as MealRow[];
    const hasMore = rows.length > PAGE_SIZE;
    const page = rows.slice(0, PAGE_SIZE);

    const days = new Map<string, HistoryEntry[]>();
    for (const meal of page) {
      const at = new Date(meal.created_at);
      const dayKey = `${String(at.getMonth() + 1).padStart(2, "0")}.${String(at.getDate()).padStart(2, "0")} ${WEEKDAYS[at.getDay()]}`;
      const items = [...meal.food_items].sort((a, b) => a.position - b.position);
      if (items.length === 0) continue;
      const entry: HistoryEntry = {
        id: meal.id,
        name: items.length > 1 ? `${items[0].name} 等 ${items.length} 项` : items[0].name,
        time: `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`,
        kcal: {
          low: items.reduce((s, i) => s + i.kcal_low, 0),
          high: items.reduce((s, i) => s + i.kcal_high, 0),
        },
        photoUrl: meal.photo_url,
      };
      days.set(dayKey, [...(days.get(dayKey) ?? []), entry]);
    }

    const result: HistoryDay[] = [...days.entries()].map(([label, entries]) => ({
      label,
      entries,
    }));
    return NextResponse.json({ days: result, hasMore });
  } catch (e) {
    const message = e instanceof Error ? e.message : "读取历史失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
