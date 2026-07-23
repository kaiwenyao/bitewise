import { createClient } from "@supabase/supabase-js";

/**
 * 服务端 Supabase 客户端(service_role,绕过 RLS)。
 * 仅在 Route Handler 中使用,切勿 import 到客户端组件。
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY,请检查 .env.local");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const PHOTO_BUCKET = "meal-photos";

/** 上传压缩后的照片(base64),返回公开 URL */
export async function uploadMealPhoto(
  base64: string,
  mimeType: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const ext =
    mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, Buffer.from(base64, "base64"), { contentType: mimeType });
  if (error) throw new Error(`照片上传失败:${error.message}`);
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}
