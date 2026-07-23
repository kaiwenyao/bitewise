import { NextResponse } from "next/server";
import { getSupabaseAdmin, PHOTO_BUCKET } from "@/lib/supabase";
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

interface SaveItem {
  name: string;
  portionGrams: number;
  kcal: { low: number; mid: number; high: number };
}

/** PATCH /api/meals/[id] — 修改记录时间或食物明细(仅限本人) */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = (await req.json()) as {
      createdAt?: string | null;
      items?: SaveItem[];
    };

    const supabase = getSupabaseAdmin();
    const { data: meal } = await supabase
      .from("meals")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    if (!meal) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    if (body.createdAt) {
      const d = new Date(body.createdAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "时间格式不合法" }, { status: 400 });
      }
      const { error } = await supabase
        .from("meals")
        .update({ created_at: d.toISOString() })
        .eq("id", params.id);
      if (error) throw new Error(`保存失败:${error.message}`);
    }

    if (Array.isArray(body.items)) {
      if (body.items.length === 0) {
        return NextResponse.json(
          { error: "至少保留一项食物;想清空请删除整条记录" },
          { status: 400 }
        );
      }
      // 整体替换:先删后插,position 按新顺序
      const { error: delError } = await supabase
        .from("food_items")
        .delete()
        .eq("meal_id", params.id);
      if (delError) throw new Error(`保存失败:${delError.message}`);
      const rows = body.items.map((item, index) => ({
        meal_id: params.id,
        name: item.name,
        portion_grams: Math.round(item.portionGrams),
        kcal_low: Math.round(item.kcal.low),
        kcal_mid: Math.round(item.kcal.mid),
        kcal_high: Math.round(item.kcal.high),
        position: index,
      }));
      const { error: insError } = await supabase.from("food_items").insert(rows);
      if (insError) throw new Error(`保存失败:${insError.message}`);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/meals/[id] — 删除自己的一条记录(级联删食物项,并清掉照片) */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    // 先取照片地址,且校验记录属于当前用户
    const { data: meal } = await supabase
      .from("meals")
      .select("id, photo_url")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    if (!meal) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    // food_items 随 on delete cascade 一起删
    const { error } = await supabase
      .from("meals")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);
    if (error) throw new Error(`删除失败:${error.message}`);

    // 清 Storage 里的照片(尽力而为,失败不影响删除结果)
    if (meal.photo_url) {
      const marker = `/${PHOTO_BUCKET}/`;
      const i = meal.photo_url.indexOf(marker);
      if (i !== -1) {
        const path = meal.photo_url.slice(i + marker.length);
        await supabase.storage.from(PHOTO_BUCKET).remove([path]);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "删除失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
