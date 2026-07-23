import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** base64 字符串长度上限(~6MB 图片),防止超大请求体 */
const MAX_BASE64_LEN = 8 * 1024 * 1024;

interface RecognizedItem {
  name: string;
  portionGrams: number;
  kcal: { low: number; mid: number; high: number };
}

const PROMPT = `你是食物营养估算助手。分析这张餐食照片,识别盘中可食用的主要食物。

规则:
- 只列出构成这餐的主要食物;忽略装饰物(点缀的香草、摆盘花、柠檬片等)、餐具、桌面、包装和背景物品
- 不确定是不是食物、或看不清的,不要列
- 同一种食物合并成一项,不要重复列出
- 宁缺毋滥:少列比多列好,严禁编造

对每种食物估计:名称(中文)、份量(克)、热量的诚实区间(low/mid/high,单位 kcal,满足 low <= mid <= high,不要伪精确)。
只返回 JSON,不要输出任何其他文字:{"items":[{"name":"烤鸡胸肉","portionGrams":150,"kcal":{"low":210,"mid":248,"high":285}}]}
照片里认不出食物时返回 {"items":[]}`;

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
      .filter(
        (i) =>
          i &&
          typeof i.name === "string" &&
          i.name.trim().length > 0 &&
          i.name.length <= 30 &&
          i.kcal
      )
      .slice(0, 12) // 兜底:防模型失控报出一长串
      .map((i) => {
        // 强制区间有序:low <= mid <= high
        const nums = [i.kcal.low, i.kcal.mid, i.kcal.high].map((n) =>
          Math.max(0, Math.round(Number(n) || 0))
        );
        const low = Math.min(...nums);
        const high = Math.max(...nums);
        const mid = Math.min(high, Math.max(low, nums[1]));
        return {
          name: i.name.trim(),
          portionGrams: Math.max(0, Math.round(Number(i.portionGrams) || 0)),
          kcal: { low, mid, high },
        };
      });
  } catch {
    return [];
  }
}
