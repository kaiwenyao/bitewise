import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-session";

export const runtime = "nodejs";

interface ItemRow {
  id: string;
  name: string;
  portion_grams: number;
  kcal_low: number;
  kcal_mid: number;
  kcal_high: number;
  position: number;
}

/** GET /api/meals/[id] — 单条记录详情(仅限本人) */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("meals")
      .select(
        "id, created_at, photo_url, food_items(id, name, portion_grams, kcal_low, kcal_mid, kcal_high, position)"
      )
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    const items = [...(data.food_items as ItemRow[])]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        id: i.id,
        name: i.name,
        portionGrams: i.portion_grams,
        kcal: { low: i.kcal_low, mid: i.kcal_mid, high: i.kcal_high },
      }));

    return NextResponse.json({
      id: data.id,
      createdAt: data.created_at,
      photoUrl: data.photo_url,
      items,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "读取失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
