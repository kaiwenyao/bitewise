import { NextResponse } from "next/server";
import { getSupabaseAdmin, PHOTO_BUCKET, uploadMealPhoto } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase-session";
import { foodItemRows, parseSaveItems } from "@/lib/parse-save-items";

export const runtime = "nodejs";

/** 与 /api/recognize 一致,防止超大 base64 撑爆内存/Storage */
const MAX_BASE64_LEN = 8 * 1024 * 1024;

async function removeUploadedPhoto(photoUrl: string | null) {
  if (!photoUrl) return;
  const marker = `/${PHOTO_BUCKET}/`;
  const i = photoUrl.indexOf(marker);
  if (i === -1) return;
  await getSupabaseAdmin()
    .storage.from(PHOTO_BUCKET)
    .remove([photoUrl.slice(i + marker.length)]);
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
      items?: unknown;
      createdAt?: string | null;
    };
    const parsed = parseSaveItems(body.items);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    if (parsed.items.length === 0) {
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
      if (typeof body.photoBase64 !== "string") {
        return NextResponse.json({ error: "图片格式不合法" }, { status: 400 });
      }
      if (body.photoBase64.length > MAX_BASE64_LEN) {
        return NextResponse.json({ error: "图片过大" }, { status: 413 });
      }
      photoUrl = await uploadMealPhoto(
        body.photoBase64,
        typeof body.mimeType === "string" && body.mimeType
          ? body.mimeType
          : "image/jpeg"
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
    if (mealError || !meal) {
      await removeUploadedPhoto(photoUrl);
      throw new Error(`保存失败:${mealError?.message ?? "保存失败"}`);
    }

    const { error: itemsError } = await supabase
      .from("food_items")
      .insert(foodItemRows(meal.id, parsed.items));
    if (itemsError) {
      await supabase.from("meals").delete().eq("id", meal.id).eq("user_id", user.id);
      await removeUploadedPhoto(photoUrl);
      throw new Error(`保存失败:${itemsError.message}`);
    }

    return NextResponse.json({ id: meal.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
