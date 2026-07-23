import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** base64 字符串长度上限(~6MB 图片),防止超大请求体 */
const MAX_BASE64_LEN = 8 * 1024 * 1024;

interface RecognizedItem {
  name: string;
  portionGrams: number;
  kcal: { low: number; mid: number; high: number };
}

const PROMPT = `你是食物营养估算助手。看这张照片,识别盘子里所有食物。
对每种食物估计:名称(中文)、份量(克)、热量的诚实区间(low/mid/high,单位 kcal,不要伪精确)。
只返回 JSON,不要输出任何其他文字,格式:{"items":[{"name":"烤鸡胸肉","portionGrams":150,"kcal":{"low":210,"mid":248,"high":285}}]}
如果照片里认不出食物,返回 {"items":[]}`;

/**
 * POST /api/recognize — { image: base64, mimeType }
 * 只做识别,不写 Storage、不写库;照片随保存动作上传(见 /api/meals)。
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { image?: string; mimeType?: string };
    if (!body.image) {
      return NextResponse.json({ error: "缺少 image" }, { status: 400 });
    }
    if (body.image.length > MAX_BASE64_LEN) {
      return NextResponse.json({ error: "图片过大" }, { status: 413 });
    }
    const items = await recognize(body.image, body.mimeType ?? "image/jpeg");
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "识别失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** 调 MiniMax Token Plan 的视觉端点,返回识别出的食物列表 */
async function recognize(
  imageBase64: string,
  mimeType: string
): Promise<RecognizedItem[]> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error("缺少 MINIMAX_API_KEY,请检查 .env.local");
  const baseUrl = (
    process.env.MINIMAX_BASE_URL ?? "https://api.minimaxi.com"
  ).replace(/\/$/, "");

  const res = await fetch(`${baseUrl}/v1/coding_plan/vlm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: PROMPT,
      image_url: `data:${mimeType};base64,${imageBase64}`,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`AI 识别请求失败(${res.status})`);
  }
  // MiniMax 业务错误:HTTP 200 但 base_resp.status_code 非 0
  if (data?.base_resp && data.base_resp.status_code !== 0) {
    throw new Error(
      `AI 识别失败:${data.base_resp.status_msg ?? "未知错误"}`
    );
  }

  return parseItems(typeof data?.content === "string" ? data.content : "");
}

/** 模型可能带寒暄或代码围栏,宽松提取 JSON;坏数据宁可丢弃 */
function parseItems(content: string): RecognizedItem[] {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(content.slice(start, end + 1)) as {
      items?: RecognizedItem[];
    };
    if (!Array.isArray(parsed.items)) return [];
    return parsed.items
      .filter((i) => i && typeof i.name === "string" && i.kcal)
      .map((i) => ({
        name: i.name,
        portionGrams: Math.max(0, Math.round(Number(i.portionGrams) || 0)),
        kcal: {
          low: Math.max(0, Math.round(Number(i.kcal.low) || 0)),
          mid: Math.max(0, Math.round(Number(i.kcal.mid) || 0)),
          high: Math.max(0, Math.round(Number(i.kcal.high) || 0)),
        },
      }));
  } catch {
    return [];
  }
}
