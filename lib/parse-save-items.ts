/** 保存/更新一餐时的食物项(与 Route Handler 入参对齐) */
export interface SaveItem {
  name: string;
  portionGrams: number;
  kcal: { low: number; mid: number; high: number };
}

function asInt(n: unknown): number | null {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? v : null;
}

/**
 * 校验并规范化食物项。非法数据返回 error,不抛异常。
 * 空数组视为合法,由调用方按「新建 / 更新」给出不同提示。
 */
export function parseSaveItems(
  raw: unknown
): { ok: true; items: SaveItem[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, error: "食物项格式不合法" };
  }

  const items: SaveItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, error: "食物项格式不合法" };
    }
    const row = entry as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!name) {
      return { ok: false, error: "食物名称不能为空" };
    }
    const kcal = row.kcal;
    if (!kcal || typeof kcal !== "object") {
      return { ok: false, error: "热量格式不合法" };
    }
    const k = kcal as Record<string, unknown>;
    const portionGrams = asInt(row.portionGrams);
    const low = asInt(k.low);
    const mid = asInt(k.mid);
    const high = asInt(k.high);
    if (portionGrams == null || low == null || mid == null || high == null) {
      return { ok: false, error: "份量或热量须为数字" };
    }
    items.push({
      name,
      portionGrams,
      kcal: { low, mid, high },
    });
  }
  return { ok: true, items };
}

export function foodItemRows(mealId: string, items: SaveItem[]) {
  return items.map((item, index) => ({
    meal_id: mealId,
    name: item.name,
    portion_grams: item.portionGrams,
    kcal_low: item.kcal.low,
    kcal_mid: item.kcal.mid,
    kcal_high: item.kcal.high,
    position: index,
  }));
}
