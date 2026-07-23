import { NextResponse } from "next/server";
import { getSupabaseAdmin, uploadMealPhoto } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-session";

export const runtime = "nodejs";

interface SaveItem {
  name: string;
  portionGrams: number;
  kcal: { low: number; mid: number; high: number };
}

/**
 * POST /api/meals — 保存一餐:{ photoBase64, mimeType, items }
 * 照片在此时才上传 Storage:识别阶段不落盘,放弃的记录不留孤儿文件。
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      photoBase64?: string | null;
      mimeType?: string;
      items?: SaveItem[];
      createdAt?: string | null;
    };
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "items 不能为空" }, { status: 400 });
    }

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 记录时间:默认当前,允许用户补记过去的餐
    let createdAt: string | null = null;
    if (body.createdAt) {
      const d = new Date(body.createdAt);
      if (!Number.isNaN(d.getTime())) createdAt = d.toISOString();
    }

    let photoUrl: string | null = null;
    if (body.photoBase64) {
      photoUrl = await uploadMealPhoto(
        body.photoBase64,
        body.mimeType ?? "image/jpeg"
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: meal, error: mealError } = await supabase
      .from("meals")
      .insert({
        photo_url: photoUrl,
        user_id: user.id,
        ...(createdAt ? { created_at: createdAt } : {}),
      })
      .select("id")
      .single();
    if (mealError) throw new Error(`保存失败:${mealError.message}`);

    const rows = body.items.map((item, index) => ({
      meal_id: meal.id,
      name: item.name,
      portion_grams: Math.round(item.portionGrams),
      kcal_low: Math.round(item.kcal.low),
      kcal_mid: Math.round(item.kcal.mid),
      kcal_high: Math.round(item.kcal.high),
      position: index,
    }));
    const { error: itemsError } = await supabase.from("food_items").insert(rows);
    if (itemsError) throw new Error(`保存失败:${itemsError.message}`);

    return NextResponse.json({ id: meal.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
